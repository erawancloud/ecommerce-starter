import { getBrand } from "@lib/brand"

/**
 * The strip across the top of the shop — โปรโมชั่น, a holiday, a shipping
 * pause. Off unless the owner turns it on, because a bar that is always there
 * is a bar nobody reads.
 */
const Announcement = async () => {
  const brand = await getBrand()
  if (!brand.announcement.enabled) {
    return null
  }
  const text = brand.announcement.th || brand.announcement.en
  if (!text) {
    return null
  }
  return (
    <div
      className="w-full px-4 py-2 text-center text-xs"
      style={{
        background: "var(--brand-primary)",
        color: "var(--brand-on-primary)",
      }}
    >
      {text}
    </div>
  )
}

export default Announcement
