/**
 * พร้อมเพย์ — the EMVCo QR payload, written out rather than installed.
 *
 * This is the whole reason a Thai shop on this starter pays no transaction
 * fee: a PromptPay QR is not a gateway, it is a string. The bank app reads the
 * destination and the amount out of it and moves the money directly between
 * the customer's account and the shop's. Nothing is called, nothing is signed,
 * and there is no third party to have a contract with.
 *
 * **What it is not**: proof of payment. Generating a QR does not tell anybody
 * that the transfer happened — the customer sends a slip and the owner presses
 * *Capture* in the admin. Bank slip-verification APIs are sold to registered
 * companies, which is a thing a shop may have and a starter may not assume.
 *
 * Structure (EMVCo merchant-presented QR, PromptPay profile):
 *
 *   00  payload format indicator — "01"
 *   01  point of initiation      — "11" reusable, "12" one-time (amount fixed)
 *   29  merchant account info    — AID A000000677010111, then one of
 *                                  01 mobile / 02 national or tax id / 03 e-wallet
 *   53  currency                 — "764" (THB, ISO 4217 numeric)
 *   54  amount                   — omitted when the payer types it in
 *   58  country                  — "TH"
 *   63  CRC                      — CRC-16/CCITT-FALSE over everything before it,
 *                                  including the "6304" tag and length
 */

const AID = "A000000677010111"

const tag = (id: string, value: string): string =>
  `${id}${String(value.length).padStart(2, "0")}${value}`

/**
 * CRC-16/CCITT-FALSE: polynomial 0x1021, initial value 0xFFFF, no reflection,
 * no final XOR. Written here because it is nine lines and a dependency for
 * nine lines is a supply chain.
 */
export function crc16(input: string): string {
  let crc = 0xffff
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

/**
 * Normalise what the owner typed into the admin into the field PromptPay wants.
 *
 * Returns `null` for anything that is not one of the three shapes, because the
 * alternative — a payload built out of a half-typed number — is a QR that a
 * bank app scans and sends money somewhere.
 */
export function promptPayTarget(
  raw: string
): { tagId: "01" | "02" | "03"; value: string } | null {
  const digits = (raw || "").replace(/\D/g, "")
  if (!digits) {
    return null
  }
  // Mobile: 10 digits starting 0 (0812345678) → 0066 + the last 9.
  if (digits.length === 10 && digits.startsWith("0")) {
    return { tagId: "01", value: `0066${digits.slice(1)}` }
  }
  // Already in international form.
  if (digits.length === 12 && digits.startsWith("66")) {
    return { tagId: "01", value: `00${digits}` }
  }
  // National id or tax id.
  if (digits.length === 13) {
    return { tagId: "02", value: digits }
  }
  // e-Wallet id.
  if (digits.length === 15) {
    return { tagId: "03", value: digits }
  }
  return null
}

/**
 * The payload string to render as a QR, or `null` when the shop has not set a
 * usable PromptPay id. Callers must handle `null` by telling the owner —
 * silently drawing nothing is a checkout that cannot be paid.
 */
export function promptPayPayload(
  promptPayId: string,
  amount?: number
): string | null {
  const target = promptPayTarget(promptPayId)
  if (!target) {
    return null
  }
  const hasAmount = typeof amount === "number" && amount > 0
  const body =
    tag("00", "01") +
    tag("01", hasAmount ? "12" : "11") +
    tag("29", tag("00", AID) + tag(target.tagId, target.value)) +
    tag("53", "764") +
    (hasAmount ? tag("54", amount!.toFixed(2)) : "") +
    tag("58", "TH")
  const withCrcTag = `${body}6304`
  return `${withCrcTag}${crc16(withCrcTag)}`
}
