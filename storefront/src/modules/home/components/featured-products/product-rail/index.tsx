import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  return (
    <section id="shop" className="content-container scroll-mt-28 py-10 small:py-20">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <span className="mb-3 block text-xs font-medium tracking-[0.18em] text-ui-fg-muted">
            เลือกจากครัว
          </span>
          <Text className="brand-heading text-3xl text-ui-fg-base small:text-4xl">
            {collection.title}
          </Text>
        </div>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          ดูทั้งหมด
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 small:grid-cols-4 small:gap-x-6 small:gap-y-16">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
      </ul>
    </section>
  )
}
