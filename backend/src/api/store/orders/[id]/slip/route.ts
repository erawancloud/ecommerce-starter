import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type Body = { email?: string; filename?: string; image?: string }

// 3MB of base64 is about 2.2MB of photo — a slip screenshot from any phone,
// and small enough that the storefront can send it as JSON instead of the
// multipart plumbing a `multer` route would need.
const MAX_BASE64 = 3 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"])

/**
 * The customer attaches the transfer slip to their own order.
 *
 * **This is evidence, not verification.** Nothing here reads the slip or asks
 * a bank anything; it files the photo against the order so the owner can look
 * at it next to the amount and press *Capture*. A shop that wants the amount,
 * time and reference read off the image automatically is the `read-docs`
 * starter's job (design/business-starters.md §3), not this one's.
 *
 * Authorisation is the pair the customer already has and a stranger does not:
 * the order id, which is only ever shown to them, **and** the email on the
 * order. Order ids are not guessable, but they do travel in a URL somebody may
 * paste, so one of them alone is not enough to attach anything.
 */
export const POST = async (
  req: MedusaRequest<Body>,
  res: MedusaResponse
) => {
  const orderId = req.params.id
  const { email, image, filename } = req.body ?? {}

  if (!email || !image) {
    res.status(400).json({ message: "email and image are required." })
    return
  }

  const match = /^data:([a-z/+.-]+);base64,(.+)$/i.exec(image)
  if (!match || !ALLOWED.has(match[1].toLowerCase())) {
    res.status(400).json({ message: "Send a JPEG, PNG or WebP data URL." })
    return
  }
  const content = match[2]
  if (content.length > MAX_BASE64) {
    res.status(413).json({ message: "That image is too large. Under 2MB, please." })
    return
  }

  const orders = req.scope.resolve(Modules.ORDER)
  let order
  try {
    order = await orders.retrieveOrder(orderId)
  } catch {
    // Deliberately the same answer as a wrong email: a different one would
    // turn this route into a way to ask whether an order id exists.
    res.status(404).json({ message: "No such order." })
    return
  }
  if ((order.email ?? "").toLowerCase() !== email.trim().toLowerCase()) {
    res.status(404).json({ message: "No such order." })
    return
  }

  const files = req.scope.resolve(Modules.FILE)
  const uploaded = await files.createFiles({
    filename: `slip-${orderId}-${Date.now()}-${(filename || "slip").replace(
      /[^a-zA-Z0-9._-]/g,
      ""
    )}`.slice(0, 120),
    mimeType: match[1].toLowerCase(),
    content,
    access: "public",
  })

  const existing = Array.isArray((order.metadata as any)?.slips)
    ? ((order.metadata as any).slips as any[])
    : []
  await orders.updateOrders(orderId, {
    metadata: {
      ...(order.metadata ?? {}),
      slips: [...existing, { url: uploaded.url, at: new Date().toISOString() }].slice(-5),
    },
  })

  res.json({ url: uploaded.url })
}
