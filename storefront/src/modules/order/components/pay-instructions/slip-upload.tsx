"use client"

import { Button, Text } from "@medusajs/ui"
import { useState } from "react"
import { uploadSlip } from "./actions"

const MAX_BYTES = 2 * 1024 * 1024

/**
 * ส่งสลิป — the customer attaches the transfer slip to their own order.
 *
 * The file is read in the browser and sent as a data URL through a server
 * action, so there is no multipart route to configure and nothing to proxy
 * that is not already JSON. Refusing an over-sized file here rather than at
 * the API is not a security control — the backend caps it too — it is so the
 * person on a phone is told before they spend the upload.
 */
const SlipUpload = ({ orderId, email }: { orderId: string; email: string }) => {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError("ไฟล์ใหญ่เกิน 2MB ลองถ่ายใหม่หรือย่อรูปก่อน")
      return
    }
    setState("sending")
    const reader = new FileReader()
    reader.onload = async () => {
      const result = await uploadSlip(orderId, email, String(reader.result), file.name)
      if (result.ok) {
        setState("done")
      } else {
        setError(result.message)
        setState("idle")
      }
    }
    reader.onerror = () => {
      setError("อ่านไฟล์ไม่สำเร็จ")
      setState("idle")
    }
    reader.readAsDataURL(file)
  }

  if (state === "done") {
    return (
      <Text className="text-ui-fg-subtle mt-6 text-sm">
        ได้รับสลิปแล้ว ขอบคุณค่ะ ทางร้านจะยืนยันคำสั่งซื้อให้เร็วที่สุด
      </Text>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      <label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              void onFile(file)
            }
          }}
        />
        <Button asChild variant="secondary" isLoading={state === "sending"}>
          <span>แนบสลิปการโอน</span>
        </Button>
      </label>
      {error ? <Text className="text-ui-fg-error text-xs">{error}</Text> : null}
    </div>
  )
}

export default SlipUpload
