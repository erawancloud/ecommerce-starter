import { listCategories } from "@lib/data/categories"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandMark from "@modules/layout/components/brand-mark"
import { getBrand } from "@lib/brand"

/**
 * The footer a Thai shop is judged on: who you are, how to reach you, and that
 * there is a person behind it.
 *
 * LINE first, because for most Thai shops it *is* customer service. Every line
 * here is a brand setting the owner fills in from the admin — an empty one is
 * simply not drawn, rather than a link to nowhere.
 */
export default async function Footer() {
  const [brand, productCategories] = await Promise.all([
    getBrand(),
    listCategories(),
  ])
  const c = brand.contact

  const socials = [
    c.facebook && { label: "Facebook", href: c.facebook },
    c.instagram && { label: "Instagram", href: c.instagram },
    c.tiktok && { label: "TikTok", href: c.tiktok },
  ].filter(Boolean) as { label: string; href: string }[]

  const lineHref = c.line_oa
    ? `https://line.me/R/ti/p/${encodeURIComponent(c.line_oa)}`
    : ""

  return (
    <footer className="border-ui-border-base w-full border-t">
      <div className="content-container flex flex-col gap-12 py-16">
        <div className="grid grid-cols-1 gap-10 small:grid-cols-4">
          <div className="flex flex-col gap-3 small:col-span-2">
            <LocalizedClientLink href="/" className="flex items-center">
              <BrandMark />
            </LocalizedClientLink>
            <Text className="text-ui-fg-subtle max-w-sm text-sm">
              {brand.tagline.th || brand.tagline.en}
            </Text>
            {c.address ? (
              <Text className="text-ui-fg-muted max-w-sm whitespace-pre-line text-xs">
                {c.address}
              </Text>
            ) : null}
          </div>

          {productCategories?.length ? (
            <div className="flex flex-col gap-2">
              <span className="txt-small-plus text-ui-fg-base">หมวดสินค้า</span>
              <ul className="text-ui-fg-subtle flex flex-col gap-2 text-sm">
                {productCategories.slice(0, 6).map((category) => {
                  if (category.parent_category) {
                    return null
                  }
                  return (
                    <li key={category.id}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={`/categories/${category.handle}`}
                      >
                        {category.name}
                      </LocalizedClientLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="txt-small-plus text-ui-fg-base">ช่วยเหลือ</span>
              <ul className="text-ui-fg-subtle flex flex-col gap-2 text-sm">
                <li><LocalizedClientLink className="hover:text-ui-fg-base" href="/store">สินค้าทั้งหมด</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-ui-fg-base" href="/account/orders">ติดตามคำสั่งซื้อ</LocalizedClientLink></li>
                <li><LocalizedClientLink className="hover:text-ui-fg-base" href="/cart">ตะกร้าของฉัน</LocalizedClientLink></li>
              </ul>
            </div>
            {(lineHref || c.phone || c.email || socials.length) ? (
            <div className="flex flex-col gap-2">
              <span className="txt-small-plus text-ui-fg-base">ติดต่อร้าน</span>
            <ul className="text-ui-fg-subtle flex flex-col gap-2 text-sm">
              {lineHref ? (
                <li>
                  <a className="hover:text-ui-fg-base" href={lineHref} rel="noreferrer">
                    LINE {c.line_oa}
                  </a>
                </li>
              ) : null}
              {c.phone ? (
                <li>
                  <a className="hover:text-ui-fg-base" href={`tel:${c.phone}`}>
                    โทร {c.phone}
                  </a>
                </li>
              ) : null}
              {c.email ? (
                <li>
                  <a className="hover:text-ui-fg-base" href={`mailto:${c.email}`}>
                    {c.email}
                  </a>
                </li>
              ) : null}
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    className="hover:text-ui-fg-base"
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            </div>
            ) : null}
          </div>
        </div>

        <div className="border-ui-border-base flex flex-col gap-2 border-t pt-6 small:flex-row small:items-center small:justify-between">
          <Text className="text-ui-fg-muted text-xs">
            © {new Date().getFullYear()} {brand.shop_name.th || brand.shop_name.en}
          </Text>
          <Text className="text-ui-fg-muted text-xs">
            ราคาทั้งหมดเป็นเงินบาท รวมภาษีแล้ว
          </Text>
        </div>
      </div>
    </footer>
  )
}
