import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle } from "@lib/data/collections"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const metadata = {
    title: collection.title,
    description: `${collection.title} collection`,
  } as Metadata

  return metadata
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
