export const dynamic = "force-dynamic"

/**
 * Readiness for the storefront process, and nothing more than that.
 *
 * It deliberately does **not** call the backend. A storefront that reports
 * itself unready whenever Medusa restarts would take the shop's only public
 * ingress down for the length of a backend rollout — the backend has a probe
 * of its own for that. What this answers is the one question Kubernetes is
 * actually asking: is there a Node process here serving HTTP on this port.
 *
 * It is a real route rather than a path the app happens to answer, for the
 * reason CLAUDE.md gives under "a check that asks 'is there something'": a
 * single-page fallback that returns index.html with a 200 passes for the life
 * of the app, including while the thing behind it is dead.
 */
export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "content-type": "text/plain", "cache-control": "no-store" },
  })
}
