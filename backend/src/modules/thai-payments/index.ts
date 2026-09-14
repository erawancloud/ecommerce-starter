import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import {
  BankTransferProviderService,
  CashOnDeliveryProviderService,
  PromptPayProviderService,
} from "./service"

/**
 * One provider module, three payment methods.
 *
 * Registered in medusa-config.ts with `id: "th"`, so the ids Medusa stores are
 * `pp_promptpay_th`, `pp_cod_th` and `pp_banktransfer_th`. The seed enables
 * all three on the Thailand region; the owner turns off what they do not
 * offer in **Settings → Regions**.
 */
export default ModuleProvider(Modules.PAYMENT, {
  services: [
    PromptPayProviderService,
    CashOnDeliveryProviderService,
    BankTransferProviderService,
  ],
})
