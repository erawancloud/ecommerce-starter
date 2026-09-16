import { Button, Heading } from "@medusajs/ui"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getBrand } from "@lib/brand"

/**
 * The one place the three themes differ in structure rather than in type.
 *
 * Everything else a theme changes — headline face, weight, letter-spacing,
 * corner radius, section rhythm — is CSS keyed off `html[data-theme]`
 * (styles/brand.css). A hero is the exception because it is the first
 * impression, and a shop selling ของฝาก and a shop selling jewellery do not
 * want the same one.
 */
const Hero = async () => {
  const brand = await getBrand()
  const name = brand.shop_name.th || brand.shop_name.en
  const tagline = brand.tagline.th || brand.tagline.en
  // A real, named demo gets real art direction. A merchant who changes the
  // sample shop's name never inherits somebody else's pantry photograph.
  const isKruaKhunYaiDemo = name.trim() === "ครัวคุณยาย"

  const cta = (
    <LocalizedClientLink href="/store">
      <Button size="large">ดูสินค้าทั้งหมด</Button>
    </LocalizedClientLink>
  )

  if (brand.theme === "market") {
    // ตลาด: no tall hero at all. A dense shop puts products above the fold and
    // says what it is in one line — the way a market stall does.
    return (
      <div className="w-full border-b border-ui-border-base bg-ui-bg-subtle">
        <div className="content-container flex flex-col gap-3 py-8 small:flex-row small:items-center small:justify-between">
          <div>
            <Heading level="h1" className="text-2xl text-ui-fg-base">
              {name}
            </Heading>
            <p className="text-ui-fg-subtle mt-1 text-sm">{tagline}</p>
          </div>
          {cta}
        </div>
      </div>
    )
  }

  if (brand.theme === "studio") {
    // สตูดิโอ: whitespace does the talking. Centred, quiet, nothing but the
    // name, one line and one link.
    return (
      <div className="w-full border-b border-ui-border-base">
        <div className="content-container flex flex-col items-center gap-8 py-28 text-center small:py-40">
          <Heading level="h1" className="text-ui-fg-base text-3xl small:text-5xl">
            {name}
          </Heading>
          <p className="text-ui-fg-subtle max-w-xl text-base">{tagline}</p>
          {cta}
        </div>
      </div>
    )
  }

  // สยาม: a warm band in the brand's own colour, the tagline given room.
  // The named demo adds an editorial still life; ordinary shops remain a
  // neutral canvas until their owner chooses their own content.
  return (
    <div
      className="relative isolate w-full overflow-hidden border-b border-ui-border-base"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 12%, var(--brand-paper)) 0%, var(--brand-paper) 100%)",
      }}
    >
      {isKruaKhunYaiDemo && (
        <>
          <Image
            src="/demo/krua-khunyai/hero-pantry.webp"
            alt="ผลิตภัณฑ์จากครัวคุณยายบนโต๊ะไม้ในแสงแดดอ่อน"
            fill
            priority
            sizes="100vw"
            className="z-0 object-cover object-[68%_center]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(90deg, var(--brand-paper) 0%, color-mix(in srgb, var(--brand-paper) 94%, transparent) 32%, color-mix(in srgb, var(--brand-paper) 50%, transparent) 56%, transparent 76%)",
            }}
          />
        </>
      )}
      <div className="content-container relative z-20 flex flex-col items-start gap-6 py-20 small:py-28">
        <span
          className="brand-accent-bg rounded-full px-3 py-1 text-xs"
          style={{ borderRadius: "var(--brand-radius)" }}
        >
          ส่งทั่วไทย
        </span>
        <Heading level="h1" className="text-ui-fg-base max-w-2xl text-3xl small:text-5xl">
          {name}
        </Heading>
        <p className="text-ui-fg-subtle max-w-xl text-base small:text-lg">{tagline}</p>
        {cta}
      </div>
    </div>
  )
}

export default Hero
