import QRCode from "qrcode"
import { Heading, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import { getBrand } from "@lib/brand"
import { promptPayPayload } from "@lib/promptpay"
import { isBankTransfer, isCashOnDelivery, isPromptPay } from "@lib/constants"
import SlipUpload from "./slip-upload"

/**
 * How to actually pay, shown once the order exists.
 *
 * The QR is rendered **on the server, into a data URL**. A client-side QR
 * library would be another 40kB on the one page that matters most, and a
 * payload built in the browser is a payload a browser extension can rewrite —
 * this one is built from the shop's own record and drawn before it leaves us.
 */
const PayInstructions = async ({ order }: { order: HttpTypes.StoreOrder }) => {
  const provider = order.payment_collections?.[0]?.payments?.[0]?.provider_id
  if (!provider) {
    return null
  }
  const brand = await getBrand()

  if (isCashOnDelivery(provider)) {
    return (
      <section className="brand-card p-6">
        <Heading level="h2" className="text-xl">
          เก็บเงินปลายทาง
        </Heading>
        <Text className="text-ui-fg-subtle mt-2 text-sm">
          เตรียมเงินสด {new Intl.NumberFormat("th-TH").format(order.total)} บาท
          ให้พนักงานส่งของตอนรับสินค้า ทางร้านจะติดต่อกลับเพื่อยืนยันคำสั่งซื้อ
        </Text>
      </section>
    )
  }

  if (isBankTransfer(provider)) {
    const bank = brand.bank
    return (
      <section className="brand-card p-6">
        <Heading level="h2" className="text-xl">
          โอนเงินผ่านธนาคาร
        </Heading>
        {bank.account_no ? (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-ui-fg-muted">ธนาคาร</dt>
            <dd>{bank.name}</dd>
            <dt className="text-ui-fg-muted">ชื่อบัญชี</dt>
            <dd>{bank.account_name}</dd>
            <dt className="text-ui-fg-muted">เลขที่บัญชี</dt>
            <dd className="brand-price font-mono">{bank.account_no}</dd>
            <dt className="text-ui-fg-muted">ยอดที่ต้องโอน</dt>
            <dd className="brand-price">
              {new Intl.NumberFormat("th-TH").format(order.total)} บาท
            </dd>
          </dl>
        ) : (
          <Text className="text-ui-fg-subtle mt-2 text-sm">
            ทางร้านจะแจ้งเลขบัญชีให้ทราบทางอีเมลหรือ LINE
          </Text>
        )}
        <SlipUpload orderId={order.id} email={order.email ?? ""} />
      </section>
    )
  }

  if (!isPromptPay(provider)) {
    return null
  }

  const payload = promptPayPayload(brand.promptpay_id, order.total)
  if (!payload) {
    // Said out loud rather than rendered as a blank box: the shop has not set
    // a PromptPay id, and the only person who can fix that is the owner.
    return (
      <section className="brand-card p-6">
        <Heading level="h2" className="text-xl">
          พร้อมเพย์
        </Heading>
        <Text className="text-ui-fg-subtle mt-2 text-sm">
          ทางร้านยังไม่ได้ตั้งค่าพร้อมเพย์ กรุณาติดต่อร้านเพื่อขอช่องทางชำระเงิน
        </Text>
      </section>
    )
  }

  const qr = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  })

  return (
    <section className="brand-card p-6">
      <Heading level="h2" className="text-xl">
        สแกนจ่ายด้วยพร้อมเพย์
      </Heading>
      <div className="mt-4 flex flex-col items-start gap-6 small:flex-row">
        {/* Plain <img>: a data URL has nothing for the image optimiser to do. */}
        <img
          src={qr}
          alt="QR พร้อมเพย์"
          width={220}
          height={220}
          className="bg-white p-2"
          style={{ borderRadius: "var(--brand-radius)" }}
        />
        <div className="text-sm">
          <Text className="brand-price text-lg">
            {new Intl.NumberFormat("th-TH").format(order.total)} บาท
          </Text>
          <Text className="text-ui-fg-subtle mt-2">
            เปิดแอปธนาคาร เลือกสแกน แล้วสแกน QR นี้ ยอดเงินถูกกำหนดมาแล้ว
          </Text>
          <Text className="text-ui-fg-muted mt-2 text-xs">
            เลขที่คำสั่งซื้อ #{order.display_id}
          </Text>
          <Text className="text-ui-fg-muted mt-2 text-xs">
            ทางร้านจะตรวจสอบสลิปและยืนยันคำสั่งซื้ออีกครั้ง
          </Text>
        </div>
      </div>
      <SlipUpload orderId={order.id} email={order.email ?? ""} />
    </section>
  )
}

export default PayInstructions
