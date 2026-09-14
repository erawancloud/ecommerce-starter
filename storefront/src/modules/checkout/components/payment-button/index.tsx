"use client"

import { isOffline } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

/**
 * One button, because every method this shop offers is settled by a person.
 *
 * Upstream branches here between a Stripe confirmation and a manual one. There
 * is nothing to confirm with a third party: pressing this creates the order,
 * and the customer is then shown the QR, the bank account, or nothing at all
 * if they are paying the courier.
 */
const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  if (!isOffline(paymentSession?.provider_id)) {
    return <Button disabled>เลือกวิธีชำระเงินก่อน</Button>
  }

  return <PlaceOrderButton notReady={notReady} data-testid={dataTestId} />
}

const PlaceOrderButton = ({
  notReady,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setSubmitting(true)
    // Cleared only on failure. `placeOrder` redirects when it succeeds, so the
    // button stays in its loading state until the page changes — which is what
    // stops a second click from placing a second order.
    await placeOrder().catch((err) => {
      setErrorMessage(err.message)
      setSubmitting(false)
    })
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId ?? "submit-order-button"}
      >
        ยืนยันคำสั่งซื้อ
      </Button>
      <ErrorMessage error={errorMessage} data-testid="payment-error-message" />
    </>
  )
}

export default PaymentButton
