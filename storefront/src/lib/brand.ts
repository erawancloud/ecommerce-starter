import { BACKEND_URL, publishableKey } from "@lib/erawan"
import { DEFAULT_BRAND, sanitise, type Brand } from "@lib/brand-contract"

export type { Brand }
export { DEFAULT_BRAND, THEME_IDS } from "@lib/brand-contract"

/**
 * The shop's own look and words, read from the backend on every render.
 *
 * **`no-store`, and that was measured rather than chosen.** With
 * `next: { revalidate: 60 }` the fetch was cached for a minute — but because
 * this runs in the root layout, it also made the *page* cacheable, so a shop
 * whose owner had just changed its theme kept serving the old one from Next's
 * full route cache long after the API was returning the new brand. The same
 * request with a cache-busting query string came back correct, which is the
 * tell. A brand that updates "eventually" is indistinguishable from a save
 * that did not work, and the person watching is the one who just pressed it.
 *
 * The cost is one in-cluster GET per render, on a route Medusa answers from a
 * single row, and every page of a shop is dynamic anyway: prices, stock and
 * the cart are not things to serve from last minute's cache.
 *
 * Next dedupes identical fetches within one render, so a page that reads the
 * brand in the layout, the nav and the footer still makes one request.
 */
export async function getBrand(): Promise<Brand> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/brand`, {
      headers: { "x-publishable-api-key": await publishableKey() },
      cache: "no-store",
    })
    if (!res.ok) {
      return DEFAULT_BRAND
    }
    const body = (await res.json()) as { brand?: unknown }
    // Sanitised again on the way in. The storefront renders colours straight
    // into a `style` attribute and tag ids straight into a `<script>`, so it
    // does not get to assume the API it is talking to is the one we shipped.
    return sanitise(body.brand)
  } catch {
    // A shop whose backend is briefly unreachable renders in the default
    // brand rather than not at all: the header, the footer and the error page
    // all need these values, so throwing here turns one slow request into a
    // white screen.
    return DEFAULT_BRAND
  }
}
