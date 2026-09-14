/**
 * Thai first, English second — and the strings live where they are used.
 *
 * Same shape the console and the landing page use (CLAUDE.md, Console notes):
 * no key file. A central dictionary conflicts on every string when two people
 * edit the shop at once and drifts into `cart.title` appearing on screen; an
 * untranslated call here is simply English, which is a visible, harmless
 * failure rather than a broken key.
 *
 * The one glossary entry the platform fixes: **deploy is ขึ้นระบบ**
 * (PRODUCT.md Decisions §1). Nothing in a storefront says it, but a shop owner
 * reading our README does.
 */

export type Lang = "th" | "en"

export const t =
  (lang: Lang) =>
  (th: string, en: string): string =>
    lang === "th" ? th : en

/**
 * Which language this request is in.
 *
 * A Thai shop's customers are Thai, so Thai is the default and English is what
 * a browser has to ask for — the reverse of the platform's own surfaces, and
 * deliberate: `?lang=` wins, then the Accept-Language header, then Thai.
 */
export function pickLang(search?: string | null, acceptLanguage?: string | null): Lang {
  const asked = new URLSearchParams(search ?? "").get("lang")
  if (asked === "en" || asked === "th") {
    return asked
  }
  const header = (acceptLanguage ?? "").toLowerCase()
  if (header && !header.includes("th")) {
    return "en"
  }
  return "th"
}
