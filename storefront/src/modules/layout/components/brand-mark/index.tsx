import { getBrand } from "@lib/brand"

/**
 * The shop's name, or its logo when one is set.
 *
 * `<img>` rather than next/image on purpose: the logo is whatever the owner
 * uploaded, at whatever size, and the optimiser would be resizing a file that
 * changes the moment somebody saves the admin form. It is also the one image
 * on the page that must never be the thing that fails to render.
 */
const BrandMark = async ({ className }: { className?: string }) => {
  const brand = await getBrand()
  const name = brand.shop_name.th || brand.shop_name.en
  if (brand.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt={name}
        className={className ?? "h-8 w-auto object-contain"}
      />
    )
  }
  return <span className="brand-heading text-base">{name}</span>
}

export default BrandMark
