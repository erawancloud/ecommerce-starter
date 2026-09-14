"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

/**
 * Nothing to wrap.
 *
 * Upstream this mounts Stripe Elements around the checkout step. Every payment
 * method this starter offers — พร้อมเพย์, โอนเงิน, เก็บเงินปลายทาง — is settled
 * outside the browser, so there is no third-party SDK to initialise, no key to
 * hold and no script from another origin on the checkout page. The component
 * is kept rather than deleted because the checkout template renders it, and a
 * shop that later adds a real gateway puts it back here.
 */
const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ children }) => (
  <div>{children}</div>
)

export default PaymentWrapper
