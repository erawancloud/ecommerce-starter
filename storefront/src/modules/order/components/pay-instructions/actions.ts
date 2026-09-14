"use server"

import { BACKEND_URL, publishableKey } from "@lib/erawan"

/**
 * Posts the slip to the backend from the server, not the browser.
 *
 * The Store API is reached over the cluster network, so the photo never makes
 * a second public round trip and the publishable key stays here.
 */
export async function uploadSlip(
  orderId: string,
  email: string,
  image: string,
  filename: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/orders/${encodeURIComponent(orderId)}/slip`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-publishable-api-key": await publishableKey(),
        },
        body: JSON.stringify({ email, image, filename }),
        cache: "no-store",
      }
    )
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      return { ok: false, message: body.message ?? "ส่งสลิปไม่สำเร็จ" }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: "ส่งสลิปไม่สำเร็จ ลองใหม่อีกครั้ง" }
  }
}
