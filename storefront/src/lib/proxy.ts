import { BACKEND_URL } from "@lib/erawan"

/**
 * The admin dashboard, its API, its sign-in and the shop's uploaded photos,
 * served from the storefront's hostname.
 *
 * **Why any of this exists.** An Erawan release has exactly one public
 * component, and a component that wants a hostname of its own must write a
 * literal name into `erawan.yaml` — which claims it in the platform's flat,
 * first-come namespace, so the *second* customer to deploy this template would
 * be refused. One public host it is. The backend therefore has no ingress at
 * all: the only way in is this file, which also means its Store API is not on
 * the internet by accident.
 *
 * **Why a route handler rather than `rewrites()`.** `output: "standalone"`
 * freezes next.config.js into the build, so a rewrite destination built from
 * an environment variable is the value that variable had *at build time* —
 * which on Erawan is never the right one. This runs per request.
 *
 * Three details are load-bearing:
 *
 * - **Hop-by-hop headers are dropped both ways.** Forwarding `connection` or
 *   a client's `content-length` onto a stream that undici re-frames produces
 *   responses that truncate under exactly the conditions nobody tests: a large
 *   product photo.
 * - **`redirect: "manual"`.** Medusa's sign-in answers 3xx with a Set-Cookie,
 *   and following it here would swallow the cookie and return the *target's*
 *   body to a browser that never learned it had moved.
 * - **`res.headers` is passed through whole**, so several Set-Cookie headers
 *   survive. Copying them into a plain object keeps only the last one, which
 *   is a session that works until it silently does not.
 */

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "host",
])

const clean = (headers: Headers): Headers => {
  const out = new Headers()
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      out.set(key, value)
    }
  })
  return out
}

export async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const target = `${BACKEND_URL}${url.pathname}${url.search}`

  const hasBody = !["GET", "HEAD"].includes(request.method)
  const upstream = await fetch(target, {
    method: request.method,
    headers: clean(request.headers),
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    cache: "no-store",
    // Required by undici whenever a stream is sent as the body.
    ...(hasBody ? { duplex: "half" } : {}),
  } as RequestInit)

  const headers = new Headers()
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.append(key, value)
    }
  })

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}
