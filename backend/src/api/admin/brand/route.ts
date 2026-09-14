import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { DEFAULT_BRAND, sanitise, type Brand } from "../../../lib/brand"

const load = async (req: MedusaRequest) => {
  const store = req.scope.resolve(Modules.STORE)
  const [first] = await store.listStores({}, { take: 1 })
  if (!first) {
    throw new Error("No store exists yet. The seed has not run.")
  }
  return { store, row: first }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { row } = await load(req)
  res.json({ brand: sanitise((row.metadata as any)?.brand ?? DEFAULT_BRAND) })
}

export const POST = async (
  req: MedusaRequest<Partial<Brand>>,
  res: MedusaResponse
) => {
  const { store, row } = await load(req)
  // Merged over what is stored, so a form that posts one section does not
  // silently blank the rest — and sanitised after the merge, so the result is
  // a whole brand whichever half arrived.
  const merged = sanitise({
    ...(sanitise((row.metadata as any)?.brand ?? DEFAULT_BRAND) as any),
    ...(req.body as any),
  })
  await store.updateStores(row.id, {
    metadata: { ...(row.metadata ?? {}), brand: merged },
  })
  res.json({ brand: merged })
}
