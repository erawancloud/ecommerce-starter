import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = productCategory.name

    const description = productCategory.description ?? `${title} category.`

    return {
      title,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
    />
  )
}
