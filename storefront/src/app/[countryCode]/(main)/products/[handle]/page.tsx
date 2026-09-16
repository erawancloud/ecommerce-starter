import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { resolveDemoImage } from "@lib/demo-images"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

/**
 * No `generateStaticParams` here, and that is an Erawan constraint rather than
 * a preference.
 *
 * Upstream prerenders every product, collection and category at build time by
 * calling the Store API. On Erawan both components of a release are built
 * *before* either of them runs, so at `next build` there is no Medusa to ask —
 * the build fails with ECONNREFUSED and a stack that names a page rather than
 * the cause. It is also the wrong shape for a shop: a catalogue changes in the
 * admin all day, and a page baked at build time would keep showing last
 * week's price until somebody redeployed.
 *
 * Pages are rendered on demand instead, with the Store API's own cache tags
 * doing the work prerendering would have done.
 */

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return product.images!.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: product.title,
    description: `${product.title}`,
    openGraph: {
      title: product.title,
      description: `${product.title}`,
      images: product.thumbnail ? [resolveDemoImage(product.thumbnail)] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  if (!pricedProduct) {
    notFound()
  }

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
    />
  )
}
