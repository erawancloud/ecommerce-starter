import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { DEFAULT_BRAND, sanitise } from "../../../lib/brand"

/**
 * What the storefront renders itself from. Public by construction — it is the
 * shop's own logo, colours, LINE id and PromptPay number, all of which are
 * printed on the page anyway — and it is sanitised on the way *in* rather than
 * trusted on the way out (see src/lib/brand.ts).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const store = req.scope.resolve(Modules.STORE)
  const [first] = await store.listStores({}, { take: 1 })
  const brand = sanitise((first?.metadata as any)?.brand ?? DEFAULT_BRAND)
  res.json({ brand, store_name: first?.name ?? brand.shop_name.en })
}
