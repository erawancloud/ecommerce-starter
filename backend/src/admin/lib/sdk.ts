import Medusa from "@medusajs/js-sdk"

/**
 * The admin dashboard's own client. `baseUrl: "/"` because the admin is served
 * from the same origin as this API — on Erawan the storefront proxies both —
 * and session auth because that is what the dashboard already signed in with.
 */
export const sdk = new Medusa({
  baseUrl: "/",
  auth: { type: "session" },
})
