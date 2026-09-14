/**
 * Where the backend is, and how this storefront gets its publishable key.
 *
 * Both answers are **run-time**. On Erawan the two components of one release
 * are built before either of them runs, and the key is created by the seed on
 * the backend's first boot — so a `NEXT_PUBLIC_…` key, which `next build`
 * inlines, is always the key of the deploy before, and on the first deploy it
 * is no key at all.
 *
 * This module is imported by `middleware.ts` as well as by server actions, so
 * it uses nothing but `fetch` and a module-scope cache: no `server-only`, no
 * Node built-ins, nothing the edge runtime refuses.
 */

/**
 * The backend's in-cluster address. `ERAWAN_COMPONENT_BACKEND_URL` is injected
 * into every component of a release by the platform
 * (`k8s_engine.component_urls`) and points at the sibling's Service, so this
 * traffic never leaves the namespace and never needs a public ingress on the
 * API.
 */
export const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.ERAWAN_COMPONENT_BACKEND_URL ||
  "http://localhost:9000"

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET || ""

let cached: string | null = null
let inflight: Promise<string> | null = null

async function ask(): Promise<string> {
  // An explicit key always wins: a shop that has moved its backend elsewhere,
  // or a developer running against a remote one, sets this and nothing here
  // has to be reachable.
  const explicit = process.env.MEDUSA_PUBLISHABLE_KEY
  if (explicit) {
    return explicit
  }
  const res = await fetch(`${BACKEND_URL}/internal/bootstrap`, {
    headers: { "x-erawan-bootstrap": BOOTSTRAP_SECRET },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(
      `Could not read the publishable key from the backend (${res.status}). ` +
        "The usual cause is BOOTSTRAP_SECRET differing between the two " +
        "components, or the backend still running its first seed."
    )
  }
  const body = (await res.json()) as { publishable_key?: string }
  if (!body.publishable_key) {
    throw new Error("The backend answered without a publishable key.")
  }
  return body.publishable_key
}

/**
 * The key, asked for once and then remembered for the life of the process.
 *
 * `inflight` matters more than the cache: the first page view fans out into a
 * dozen parallel Store API calls, and without it every one of them would ask
 * the backend for the key at the same moment.
 */
export async function publishableKey(): Promise<string> {
  if (cached) {
    return cached
  }
  if (!inflight) {
    inflight = ask()
      .then((key) => {
        cached = key
        return key
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}
