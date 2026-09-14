import crypto from "crypto"
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

/**
 * The three ways a Thai shop is paid without a gateway.
 *
 * **What this provider does not do, and the README says so on the card: it
 * does not verify a payment with a bank.** Slip-verification APIs are sold to
 * registered companies; card acquiring is a contract and a percentage. What is
 * left — and what almost every small Thai shop actually runs on — is the
 * customer paying by PromptPay, bank transfer or cash, and the owner confirming
 * it. So the flow here is:
 *
 *   1. `initiatePayment` writes a short reference the customer can quote.
 *   2. `authorizePayment` returns **authorized**, so the cart completes and the
 *      order exists the moment the customer presses the button. It is not a
 *      claim that money arrived.
 *   3. The owner sees the order, checks the slip, and presses *Capture* in the
 *      admin — which is the moment Medusa records the money as taken.
 *
 * The alternative, returning `pending_authorization`, keeps the cart from
 * creating a Payment record at all and leaves the order "awaiting". It is the
 * more literal reading of the truth and it was not chosen: there is no admin
 * button that re-authorizes an offline session, so the owner would have no way
 * to move the order on from inside the dashboard they were given.
 *
 * **The QR is not drawn here.** The PromptPay payload is a pure function of
 * (PromptPay id, amount) and the id is a brand setting the owner edits in the
 * admin — a payment provider gets its own module container and reaching the
 * Store module out of it is not a thing the module system offers. The
 * storefront reads the id from `/store/brand` and renders the QR itself
 * (`storefront/src/lib/promptpay.ts`), which also keeps the payload testable
 * without a database.
 */
abstract class OfflinePaymentProvider extends AbstractPaymentProvider {
  /**
   * Declared public where the base class declares it protected — a module
   * provider is constructed by the module system, so `ModuleProvider` refuses
   * a class whose constructor it could not call.
   */
  constructor(container: Record<string, unknown>, options: Record<string, unknown>) {
    super(container, options)
  }

  /** Prefix of the reference a customer quotes to the shop. */
  protected abstract prefix(): string

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const id = crypto.randomUUID()
    return {
      id,
      data: {
        id,
        // Short, upper-case, no ambiguous characters: this gets read aloud
        // down a phone and typed into a bank app's note field.
        reference: `${this.prefix()}-${id
          .replace(/-/g, "")
          .slice(0, 6)
          .toUpperCase()}`,
        amount: input.amount,
        currency_code: input.currency_code,
        // What the storefront needs to draw the right panel. The storefront
        // must not branch on the provider id string it happens to be given:
        // that string carries the module id from medusa-config.ts and changes
        // if the module is ever registered twice.
        method: this.constructor.name,
      },
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    return { data: input.data ?? {}, status: PaymentSessionStatus.AUTHORIZED }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    return { data: { ...(input.data ?? {}), captured_at: new Date().toISOString() } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    // Nothing to call: the refund happened in a bank app or over a counter.
    // Medusa still records the amount, which is the number the owner needs.
    return { data: input.data ?? {} }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data ?? {} }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    // There is no third party to ask. Authorized until the owner captures it.
    return { status: PaymentSessionStatus.AUTHORIZED, data: input.data ?? {} }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return input.data ?? {}
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      data: {
        ...(input.data ?? {}),
        amount: input.amount,
        currency_code: input.currency_code,
      },
    }
  }

  async getWebhookActionAndData(
    _: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

/** พร้อมเพย์ — the customer scans a QR and transfers. */
export class PromptPayProviderService extends OfflinePaymentProvider {
  static identifier = "promptpay"
  protected prefix() {
    return "PP"
  }

  static validateOptions(): void | never {
    // The PromptPay id lives in the brand settings, not here — but a shop that
    // has not set one yet must fail where somebody can read it, which is the
    // storefront's checkout panel, not a boot log. See
    // storefront/src/lib/promptpay.ts.
  }
}

/** เก็บเงินปลายทาง — cash on delivery. */
export class CashOnDeliveryProviderService extends OfflinePaymentProvider {
  static identifier = "cod"
  protected prefix() {
    return "COD"
  }
}

/** โอนเงินผ่านธนาคาร — a plain bank transfer, account shown at checkout. */
export class BankTransferProviderService extends OfflinePaymentProvider {
  static identifier = "banktransfer"
  protected prefix() {
    return "BT"
  }
}

export { MedusaError }
