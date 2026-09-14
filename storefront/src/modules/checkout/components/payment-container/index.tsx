import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React, { type JSX } from "react"

import Radio from "@modules/common/components/radio"
import { isBankTransfer, isCashOnDelivery, isPromptPay } from "@lib/constants"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

/**
 * One line per way to pay, and one sentence saying what happens next.
 *
 * The sentence matters more than it looks: all three of these settle *after*
 * the order is placed, and a customer who expects a card form and gets a
 * confirmation page instead thinks the shop is broken.
 */
const WHAT_HAPPENS: { match: (id: string) => boolean; text: string }[] = [
  {
    match: isPromptPay,
    text: "ยืนยันคำสั่งซื้อแล้วจะมี QR ให้สแกนจ่าย แล้วส่งสลิปให้ทางร้าน",
  },
  {
    match: isBankTransfer,
    text: "ยืนยันคำสั่งซื้อแล้วจะมีเลขบัญชีให้โอน แล้วส่งสลิปให้ทางร้าน",
  },
  { match: isCashOnDelivery, text: "จ่ายเงินสดกับพนักงานส่งของตอนรับสินค้า" },
]

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const note = WHAT_HAPPENS.find((entry) => entry.match(paymentProviderId))?.text

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "text-small-regular mb-2 flex cursor-pointer flex-col gap-y-2 border px-8 py-4 hover:shadow-borders-interactive-with-active",
        {
          "border-ui-border-interactive":
            selectedPaymentOptionId === paymentProviderId,
        }
      )}
      style={{ borderRadius: "var(--brand-radius-lg)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <Text className="text-base-regular">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
        </div>
        <span className="text-ui-fg-base justify-self-end">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {note ? (
        <Text className="text-ui-fg-muted pl-8 text-xs">{note}</Text>
      ) : null}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer
