/**
 * The brand — one declared shape, not whatever happens to be in metadata.
 *
 * This is the whole point of the starter: a shop owner changes how the shop
 * looks and what it says about itself from the admin dashboard, and the
 * storefront picks it up on the next request. No redeploy, no developer, no
 * theme file to edit.
 *
 * It is **declared, not inferred** (CLAUDE.md: `src/lib/mock.ts` is the
 * payload's contract, and a fixture used as a type is how a white screen
 * shipped twice). Two consequences that are load-bearing:
 *
 * - `sanitise` whitelists every field. `store.metadata` is returned to the
 *   public by `/store/brand`, so an admin route that merged whatever JSON it
 *   was handed would be a way to publish arbitrary content on the shop, and
 *   a way for one careless POST to drop a key the storefront reads.
 * - `DEFAULT_BRAND` is a complete brand, not a partial. A storefront that has
 *   to guess what a missing colour means is a storefront that renders black on
 *   black the first time somebody saves a half-filled form.
 */

export type ThemeId = "siam" | "market" | "studio"

export const THEME_IDS: ThemeId[] = ["siam", "market", "studio"]

export type Brand = {
  /** Which theme's layout and components draw the shop. */
  theme: ThemeId
  shop_name: { th: string; en: string }
  tagline: { th: string; en: string }
  /** Absolute or /static path. Empty means the shop name is set in type. */
  logo_url: string
  colors: {
    primary: string
    on_primary: string
    accent: string
    ink: string
    paper: string
    muted: string
  }
  /** Corner radius family. A brand decision, not a pixel value. */
  radius: "sharp" | "soft" | "round"
  /** Latin display face. Thai is always Noto Sans Thai — see the storefront. */
  font: "sans" | "serif" | "display"
  /** พร้อมเพย์: a mobile number, a 13-digit national/tax id, or an e-wallet id. */
  promptpay_id: string
  bank: { name: string; account_name: string; account_no: string }
  contact: {
    line_oa: string
    phone: string
    facebook: string
    instagram: string
    tiktok: string
    email: string
    address: string
  }
  seo: { title_suffix: string; description: string; og_image_url: string }
  /** Marketing tags, injected by the storefront. Ids only, never scripts. */
  analytics: {
    ga4: string
    meta_pixel: string
    tiktok_pixel: string
    gtm: string
  }
  announcement: { enabled: boolean; th: string; en: string }
}

export const DEFAULT_BRAND: Brand = {
  theme: "siam",
  shop_name: { th: "ร้านของฉัน", en: "My Shop" },
  tagline: { th: "ส่งตรงจากร้าน ทั่วไทย", en: "Shipped from our shop, across Thailand" },
  logo_url: "",
  colors: {
    primary: "#B4472A",
    on_primary: "#FFFFFF",
    accent: "#C9A227",
    ink: "#1C1917",
    paper: "#FBF8F3",
    muted: "#6B6259",
  },
  radius: "soft",
  font: "sans",
  promptpay_id: "",
  bank: { name: "", account_name: "", account_no: "" },
  contact: {
    line_oa: "",
    phone: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    email: "",
    address: "",
  },
  seo: { title_suffix: "", description: "", og_image_url: "" },
  analytics: { ga4: "", meta_pixel: "", tiktok_pixel: "", gtm: "" },
  announcement: { enabled: false, th: "", en: "" },
}

const str = (v: unknown, fallback: string, max = 400): string =>
  typeof v === "string" ? v.slice(0, max) : fallback

const colour = (v: unknown, fallback: string): string =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim())
    ? v.trim().toUpperCase()
    : fallback

/**
 * An id for an analytics tag, and nothing that could be a script.
 *
 * The storefront puts these inside a `<script>` it writes itself, so anything
 * that survives this function ends up in the page. Letters, digits, dash and
 * underscore is every real GA4 / Pixel / GTM id and is not a payload.
 */
const tagId = (v: unknown): string =>
  typeof v === "string" && /^[A-Za-z0-9_-]{0,32}$/.test(v.trim())
    ? v.trim()
    : ""

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback

/** Whitelist an incoming brand against the declared shape above. */
export function sanitise(input: unknown): Brand {
  const b = (input ?? {}) as Record<string, any>
  const d = DEFAULT_BRAND
  return {
    theme: oneOf(b.theme, THEME_IDS, d.theme),
    shop_name: {
      th: str(b.shop_name?.th, d.shop_name.th, 80),
      en: str(b.shop_name?.en, d.shop_name.en, 80),
    },
    tagline: {
      th: str(b.tagline?.th, d.tagline.th, 160),
      en: str(b.tagline?.en, d.tagline.en, 160),
    },
    logo_url: str(b.logo_url, d.logo_url, 500),
    colors: {
      primary: colour(b.colors?.primary, d.colors.primary),
      on_primary: colour(b.colors?.on_primary, d.colors.on_primary),
      accent: colour(b.colors?.accent, d.colors.accent),
      ink: colour(b.colors?.ink, d.colors.ink),
      paper: colour(b.colors?.paper, d.colors.paper),
      muted: colour(b.colors?.muted, d.colors.muted),
    },
    radius: oneOf(b.radius, ["sharp", "soft", "round"] as const, d.radius),
    font: oneOf(b.font, ["sans", "serif", "display"] as const, d.font),
    promptpay_id: str(b.promptpay_id, d.promptpay_id, 32),
    bank: {
      name: str(b.bank?.name, d.bank.name, 80),
      account_name: str(b.bank?.account_name, d.bank.account_name, 120),
      account_no: str(b.bank?.account_no, d.bank.account_no, 40),
    },
    contact: {
      line_oa: str(b.contact?.line_oa, d.contact.line_oa, 80),
      phone: str(b.contact?.phone, d.contact.phone, 40),
      facebook: str(b.contact?.facebook, d.contact.facebook, 200),
      instagram: str(b.contact?.instagram, d.contact.instagram, 200),
      tiktok: str(b.contact?.tiktok, d.contact.tiktok, 200),
      email: str(b.contact?.email, d.contact.email, 120),
      address: str(b.contact?.address, d.contact.address, 400),
    },
    seo: {
      title_suffix: str(b.seo?.title_suffix, d.seo.title_suffix, 80),
      description: str(b.seo?.description, d.seo.description, 300),
      og_image_url: str(b.seo?.og_image_url, d.seo.og_image_url, 500),
    },
    analytics: {
      ga4: tagId(b.analytics?.ga4),
      meta_pixel: tagId(b.analytics?.meta_pixel),
      tiktok_pixel: tagId(b.analytics?.tiktok_pixel),
      gtm: tagId(b.analytics?.gtm),
    },
    announcement: {
      enabled: b.announcement?.enabled === true,
      th: str(b.announcement?.th, d.announcement.th, 200),
      en: str(b.announcement?.en, d.announcement.en, 200),
    },
  }
}
