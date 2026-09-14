import React from "react"
import { Cash, CreditCard, CurrencyDollar, StoreCredits } from "@medusajs/icons"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
/* วิธีชำระเงิน — the three this starter ships, keyed by the ids the seed
   enables on the Thailand region. The suffix is the module id from
   medusa-config.ts (`th`); change it there and these change with it. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_promptpay_th: { title: "พร้อมเพย์ (สแกน QR)", icon: <StoreCredits /> },
  pp_banktransfer_th: { title: "โอนเงินผ่านธนาคาร", icon: <CurrencyDollar /> },
  pp_cod_th: { title: "เก็บเงินปลายทาง", icon: <Cash /> },
  pp_system_default: { title: "ชำระเงินด้วยตนเอง", icon: <CreditCard /> },
}

export const isPromptPay = (providerId?: string) =>
  providerId?.startsWith("pp_promptpay") ?? false
export const isBankTransfer = (providerId?: string) =>
  providerId?.startsWith("pp_banktransfer") ?? false
export const isCashOnDelivery = (providerId?: string) =>
  providerId?.startsWith("pp_cod") ?? false

/* Every method here is settled by a person, so the button that places the
   order is the same one for all of them. */
export const isOffline = (providerId?: string) =>
  isPromptPay(providerId) ||
  isBankTransfer(providerId) ||
  isCashOnDelivery(providerId) ||
  (providerId?.startsWith("pp_system_default") ?? false)

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
