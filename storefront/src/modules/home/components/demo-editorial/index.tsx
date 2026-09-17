import Image from "next/image"

import { getBrand } from "@lib/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const promises = [
  { number: "01", title: "ทำทีละรอบ", body: "เลือกวัตถุดิบและทำของใหม่เป็นรอบเล็ก ๆ" },
  { number: "02", title: "ของที่บ้านเราใช้จริง", body: "ชิม ใช้ และเลือกเองก่อนวางขายทุกชิ้น" },
  { number: "03", title: "ส่งถึงบ้านทั่วไทย", body: "แพ็กจากครัวอย่างตั้งใจ พร้อมเลขติดตามพัสดุ" },
]

/**
 * Editorial content for the named sample shop only.
 *
 * The starter must still become the merchant's shop the moment its name is
 * changed in Admin, so none of this fictional demo story leaks into a real
 * brand. The commerce components above and below remain shared.
 */
export default async function DemoEditorial() {
  const brand = await getBrand()
  const isKruaKhunYaiDemo =
    (brand.shop_name.th || brand.shop_name.en).trim() === "ครัวคุณยาย"

  if (!isKruaKhunYaiDemo) {
    return null
  }

  return (
    <>
      <section className="border-y border-ui-border-base" aria-label="สิ่งที่ร้านตั้งใจทำ">
        <div className="content-container grid grid-cols-1 divide-y divide-ui-border-base py-2 small:grid-cols-3 small:divide-x small:divide-y-0">
          {promises.map((item) => (
            <div key={item.number} className="flex gap-4 px-1 py-7 small:px-8 small:first:pl-0 small:last:pr-0">
              <span className="brand-accent font-mono text-xs tabular-nums">{item.number}</span>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-ui-fg-base">{item.title}</h2>
                <p className="max-w-[18rem] text-sm leading-6 text-ui-fg-subtle">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="story" className="brand-story-surface scroll-mt-28">
        <div className="content-container grid items-center gap-12 py-20 small:grid-cols-2 small:gap-20 small:py-28">
          <div className="relative min-h-[32rem]">
            <div className="brand-story-image absolute inset-x-0 top-0 h-[82%] overflow-hidden small:right-14">
              <Image
                src="/demo/krua-khunyai/pha-khao-ma.webp"
                alt="ผ้าขาวม้าทอมือวางอยู่บนโต๊ะไม้"
                fill
                sizes="(max-width: 768px) 100vw, 48vw"
                className="object-cover"
              />
            </div>
            <div className="brand-story-image absolute bottom-0 right-0 h-[46%] w-[48%] overflow-hidden border-8 border-[var(--brand-paper)]">
              <Image
                src="/demo/krua-khunyai/herbal-soap.webp"
                alt="สบู่สมุนไพรทำมือกับขมิ้นและใบไม้"
                fill
                sizes="(max-width: 768px) 48vw, 22vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="flex max-w-xl flex-col items-start">
            <span className="mb-5 text-xs font-medium tracking-[0.18em] text-ui-fg-muted">เรื่องจากครัว</span>
            <h2 className="brand-heading text-balance text-4xl leading-tight text-ui-fg-base small:text-5xl">
              ของธรรมดา<br />ที่เลือกทำให้ดี
            </h2>
            <p className="mt-7 text-pretty text-base leading-8 text-ui-fg-subtle">
              ครัวคุณยายเริ่มจากของกินและของใช้ที่บ้านเราเลือกเอง ทำทีละรอบ
              รู้ที่มาของวัตถุดิบ และส่งต่อรสชาติเรียบง่ายแบบที่อยากมีติดบ้านไว้เสมอ
            </p>
            <blockquote className="mt-8 border-l-2 border-[var(--brand-accent)] pl-5 text-sm leading-7 text-ui-fg-muted">
              “ไม่ต้องหวือหวา แค่ทำของที่เรากล้าให้คนในบ้านใช้”
            </blockquote>
            <LocalizedClientLink
              href="/store"
              className="brand-text-link mt-10 text-sm font-semibold text-ui-fg-base"
            >
              เลือกดูของจากครัว <span aria-hidden="true">↗</span>
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      <section className="content-container py-16 small:py-24">
        <div className="brand-closing-panel grid gap-8 px-7 py-10 small:grid-cols-[1fr_auto] small:items-end small:px-12 small:py-12">
          <div>
            <span className="text-xs font-medium tracking-[0.18em] text-ui-fg-muted">ส่งจากครัวถึงหน้าบ้าน</span>
            <h2 className="brand-heading mt-4 max-w-2xl text-balance text-3xl leading-tight text-ui-fg-base small:text-4xl">
              เลือกของที่ชอบ แล้วให้เราดูแลการแพ็กและจัดส่ง
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-ui-fg-subtle">
              ชำระได้ด้วยพร้อมเพย์ โอนธนาคาร หรือเก็บเงินปลายทางตามที่ร้านเปิดไว้
            </p>
          </div>
          <LocalizedClientLink
            href="/store"
            className="brand-primary-link inline-flex min-h-11 items-center justify-center px-6 text-sm font-semibold"
          >
            ดูสินค้าทั้งหมด
          </LocalizedClientLink>
        </div>
      </section>
    </>
  )
}
