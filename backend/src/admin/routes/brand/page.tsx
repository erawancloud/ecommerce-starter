import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"
import { DEFAULT_BRAND, THEME_IDS, type Brand } from "../../../lib/brand"

/**
 * แบรนด์และธีม — the page this whole starter exists for.
 *
 * A shop owner who is doing their own marketing needs three things a developer
 * would otherwise do for them: how the shop looks, what it says about itself,
 * and where the marketing tags go. All three are here, they are saved to the
 * store's own record, and the storefront picks them up on the next request —
 * no redeploy, no build, nobody to ask.
 *
 * Everything posted here is whitelisted server-side by `src/lib/brand.ts`
 * before it is stored, because `/store/brand` publishes it.
 */

/**
 * What each theme looks best with. Applied when the theme is switched and then
 * editable — the *stored* value is what the storefront renders, so a theme can
 * suggest a shape but never silently own it.
 */
const THEME_DEFAULTS: Record<string, { radius: Brand["radius"]; font: Brand["font"] }> = {
  siam: { radius: "round", font: "serif" },
  market: { radius: "sharp", font: "sans" },
  studio: { radius: "sharp", font: "display" },
}

const THEME_LABELS: Record<string, string> = {
  siam: "สยาม — อบอุ่น มีลายไทยบาง ๆ เหมาะกับของฝาก งานคราฟต์",
  market: "ตลาด — แน่น อ่านเร็ว เหมาะกับของกินของใช้ ราคาเด่น",
  studio: "สตูดิโอ — โปร่ง ภาพใหญ่ เหมาะกับแฟชั่น เครื่องประดับ",
}

const FONT_LABELS: Record<string, string> = {
  sans: "เรียบ (Inter)",
  serif: "มีเชิง (Newsreader)",
  display: "ตัวหนา (Bricolage)",
}

const RADIUS_LABELS: Record<string, string> = {
  sharp: "เหลี่ยม",
  soft: "มนเล็กน้อย",
  round: "มนมาก",
}

type Path = string

const read = (brand: Brand, path: Path): any =>
  path.split(".").reduce<any>((acc, key) => acc?.[key], brand)

const write = (brand: Brand, path: Path, value: any): Brand => {
  const keys = path.split(".")
  const next: any = structuredClone(brand)
  let cursor = next
  keys.slice(0, -1).forEach((key) => (cursor = cursor[key]))
  cursor[keys[keys.length - 1]] = value
  return next
}

const Section = ({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="border-ui-border-base border-t px-6 py-5">
    <Heading level="h3">{title}</Heading>
    {hint ? (
      <Text size="small" className="text-ui-fg-subtle mt-1">
        {hint}
      </Text>
    ) : null}
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  </div>
)

const Field = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-1">
    <Label size="small" weight="plus">
      {label}
    </Label>
    {children}
    {hint ? (
      <Text size="xsmall" className="text-ui-fg-muted">
        {hint}
      </Text>
    ) : null}
  </div>
)

const BrandPage = () => {
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    sdk.client
      .fetch<{ brand: Brand }>("/admin/brand")
      .then((res) => setBrand(res.brand))
      .catch(() => toast.error("โหลดการตั้งค่าไม่สำเร็จ"))
      .finally(() => setLoading(false))
  }, [])

  const set = (path: Path, value: any) =>
    setBrand((current) => write(current, path, value))

  const save = async () => {
    setSaving(true)
    try {
      const res = await sdk.client.fetch<{ brand: Brand }>("/admin/brand", {
        method: "POST",
        body: brand,
      })
      // Re-read what the server actually stored rather than keeping what was
      // typed: the whitelist may have dropped a colour that was not a hex or
      // a tag id with a character in it, and the owner has to see that.
      setBrand(res.brand)
      toast.success("บันทึกแล้ว — เปิดหน้าร้านแล้วกดรีเฟรชเพื่อดู")
    } catch {
      toast.error("บันทึกไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  const text = (path: Path, placeholder = "") => (
    <Input
      value={read(brand, path) ?? ""}
      placeholder={placeholder}
      onChange={(e) => set(path, e.target.value)}
    />
  )

  const colour = (path: Path, label: string) => (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="border-ui-border-base h-8 w-10 cursor-pointer rounded border"
          value={read(brand, path)}
          onChange={(e) => set(path, e.target.value.toUpperCase())}
        />
        <Input
          value={read(brand, path)}
          onChange={(e) => set(path, e.target.value.toUpperCase())}
        />
      </div>
    </Field>
  )

  if (loading) {
    return (
      <Container className="p-6">
        <Text>กำลังโหลด…</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>แบรนด์และธีม</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            หน้าตาและข้อความของหน้าร้าน แก้ที่นี่ที่เดียว ไม่ต้อง deploy ใหม่
          </Text>
        </div>
        <Button onClick={save} isLoading={saving}>
          บันทึก
        </Button>
      </div>

      <Section
        title="ธีม"
        hint="โครงหน้าร้าน เลือกได้ตามประเภทสินค้า เปลี่ยนเมื่อไหร่ก็ได้"
      >
        <Field
          label="ธีมที่ใช้"
          hint="เปลี่ยนธีมจะปรับความมนของมุมและฟอนต์ให้เข้ากัน แก้ต่อได้ตามใจ"
        >
          <Select
            value={brand.theme}
            onValueChange={(v) =>
              setBrand((current) => {
                const suggestion = THEME_DEFAULTS[v] ?? THEME_DEFAULTS.siam
                return {
                  ...current,
                  theme: v as Brand["theme"],
                  radius: suggestion.radius,
                  font: suggestion.font,
                }
              })
            }
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {THEME_IDS.map((id) => (
                <Select.Item key={id} value={id}>
                  {THEME_LABELS[id]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </Field>
        <Field label="ความมนของมุม">
          <Select value={brand.radius} onValueChange={(v) => set("radius", v)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {Object.entries(RADIUS_LABELS).map(([id, label]) => (
                <Select.Item key={id} value={id}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </Field>
        <Field
          label="ฟอนต์ภาษาอังกฤษ"
          hint="ภาษาไทยใช้ Noto Sans Thai เสมอ — ฟอนต์ละตินส่วนใหญ่ไม่มีสระและวรรณยุกต์ไทย"
        >
          <Select value={brand.font} onValueChange={(v) => set("font", v)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {Object.entries(FONT_LABELS).map(([id, label]) => (
                <Select.Item key={id} value={id}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </Field>
      </Section>

      <Section title="สี" hint="สีหลักคือปุ่มและราคา สีรองใช้กับป้ายลดราคาและไฮไลต์">
        {colour("colors.primary", "สีหลัก")}
        {colour("colors.on_primary", "สีตัวอักษรบนสีหลัก")}
        {colour("colors.accent", "สีรอง")}
        {colour("colors.ink", "สีตัวอักษร")}
        {colour("colors.paper", "สีพื้นหลัง")}
        {colour("colors.muted", "สีตัวอักษรรอง")}
      </Section>

      <Section title="ชื่อร้านและข้อความ">
        <Field label="ชื่อร้าน (ไทย)">{text("shop_name.th")}</Field>
        <Field label="ชื่อร้าน (อังกฤษ)">{text("shop_name.en")}</Field>
        <Field label="สโลแกน (ไทย)">{text("tagline.th")}</Field>
        <Field label="สโลแกน (อังกฤษ)">{text("tagline.en")}</Field>
        <Field
          label="โลโก้ (URL)"
          hint="อัปโหลดที่ Media แล้ววาง URL มาที่นี่ ถ้าเว้นว่างจะใช้ชื่อร้านเป็นตัวอักษร"
        >
          {text("logo_url", "/static/logo.png")}
        </Field>
      </Section>

      <Section
        title="ประกาศหน้าเว็บ"
        hint="แถบบนสุดของหน้าร้าน ใช้บอกโปรโมชั่นหรือวันหยุดส่งของ"
      >
        <Field label="เปิดใช้งาน">
          <div className="flex h-8 items-center">
            <Switch
              checked={brand.announcement.enabled}
              onCheckedChange={(v) => set("announcement.enabled", v)}
            />
          </div>
        </Field>
        <div />
        <Field label="ข้อความ (ไทย)">{text("announcement.th")}</Field>
        <Field label="ข้อความ (อังกฤษ)">{text("announcement.en")}</Field>
      </Section>

      <Section
        title="การรับเงิน"
        hint="พร้อมเพย์สร้าง QR ที่หน้าชำระเงินให้เอง ไม่ผ่านตัวกลาง ไม่มีค่าธรรมเนียม — Erawan ไม่ได้ตรวจสอบสลิปให้ คุณเป็นคนกดยืนยันเอง"
      >
        <Field
          label="พร้อมเพย์"
          hint="เบอร์มือถือ เลขบัตรประชาชน 13 หลัก หรือเลขประจำตัวผู้เสียภาษี"
        >
          {text("promptpay_id", "0812345678")}
        </Field>
        <Field label="ธนาคาร">{text("bank.name", "กสิกรไทย")}</Field>
        <Field label="ชื่อบัญชี">{text("bank.account_name")}</Field>
        <Field label="เลขที่บัญชี">{text("bank.account_no")}</Field>
      </Section>

      <Section title="ติดต่อและโซเชียล" hint="แสดงที่ท้ายหน้าร้านและหน้าติดต่อ">
        <Field label="LINE Official Account" hint="เช่น @myshop">
          {text("contact.line_oa", "@myshop")}
        </Field>
        <Field label="เบอร์โทร">{text("contact.phone")}</Field>
        <Field label="Facebook (URL)">{text("contact.facebook")}</Field>
        <Field label="Instagram (URL)">{text("contact.instagram")}</Field>
        <Field label="TikTok (URL)">{text("contact.tiktok")}</Field>
        <Field label="อีเมล">{text("contact.email")}</Field>
        <div className="md:col-span-2">
          <Field label="ที่อยู่ร้าน">
            <Textarea
              value={brand.contact.address}
              onChange={(e) => set("contact.address", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="SEO"
        hint="ข้อความที่ Google และการแชร์ลิงก์จะเอาไปใช้"
      >
        <Field label="ต่อท้ายชื่อหน้า" hint="เช่น | ร้านของฉัน">
          {text("seo.title_suffix")}
        </Field>
        <Field label="ภาพตอนแชร์ลิงก์ (URL)">{text("seo.og_image_url")}</Field>
        <div className="md:col-span-2">
          <Field label="คำอธิบายร้าน">
            <Textarea
              value={brand.seo.description}
              onChange={(e) => set("seo.description", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="แท็กการตลาด"
        hint="ใส่เฉพาะรหัส ไม่ต้องวางสคริปต์ — หน้าร้านจะติดตั้งให้เอง"
      >
        <Field label="Google Analytics 4" hint="G-XXXXXXXXXX">
          {text("analytics.ga4", "G-XXXXXXXXXX")}
        </Field>
        <Field label="Google Tag Manager" hint="GTM-XXXXXXX">
          {text("analytics.gtm", "GTM-XXXXXXX")}
        </Field>
        <Field label="Meta Pixel" hint="ตัวเลขจาก Events Manager">
          {text("analytics.meta_pixel")}
        </Field>
        <Field label="TikTok Pixel">{text("analytics.tiktok_pixel")}</Field>
      </Section>

      <div className="flex justify-end px-6 py-4">
        <Button onClick={save} isLoading={saving}>
          บันทึก
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "แบรนด์และธีม",
  icon: Swatch,
})

export default BrandPage
