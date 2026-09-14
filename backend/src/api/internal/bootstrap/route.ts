import crypto from "crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * How the storefront learns its publishable key — at run time, from here.
 *
 * The obvious alternative is a build argument, and it cannot work on Erawan:
 * `NEXT_PUBLIC_*` is inlined by `next build`, the key is created by the seed
 * the *first time this container boots*, and both components of a release are
 * built before either of them runs. A key baked at build time is therefore
 * always the key of the deploy before — on the first deploy, no key at all.
 *
 * The second alternative is to make the seed write a deterministic token
 * derived from a shared secret, so both sides can compute it. That works until
 * the `api_key` table changes shape under us, and it makes a credential out of
 * a value we would then have to keep in step by hand.
 *
 * So: the storefront asks. This route has **no public ingress** — the backend
 * component is reached only over the cluster network by its sibling — and it
 * is guarded anyway, because "nothing can reach it" is a claim about a
 * deployment, and this file outlives any one deployment.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const expected = process.env.BOOTSTRAP_SECRET || ""
  const offered = String(req.headers["x-erawan-bootstrap"] ?? "")
  const a = Buffer.from(expected)
  const b = Buffer.from(offered)
  // Length is compared first because timingSafeEqual throws on a mismatch —
  // and an empty BOOTSTRAP_SECRET must refuse everything rather than match "".
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(404).json({ message: "Not found" })
    return
  }

  const apiKey = req.scope.resolve(Modules.API_KEY)
  const all = await apiKey.listApiKeys({ type: "publishable" })
  // Filtered here rather than in the query: `revoked_at` is not a documented
  // filter on this service, and a filter the module quietly ignores would hand
  // the storefront a revoked key that fails every request with a 401 nobody
  // can trace back to this line.
  const keys = all
    .filter((k) => !k.revoked_at)
    .sort((x, y) => +new Date(x.created_at) - +new Date(y.created_at))
  if (!keys.length) {
    res.status(503).json({ message: "No publishable key yet — the seed has not finished." })
    return
  }
  res.json({ publishable_key: keys[0].token })
}
