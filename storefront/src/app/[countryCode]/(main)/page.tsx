import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

// No `metadata` here on purpose: the shop's title and description are brand
// settings and are produced by `generateMetadata` in app/layout.tsx, so a page
// that declared its own would pin the home page to whatever was true the day
// it was written.

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!region) {
    // A shop with no region cannot price anything. Collections are optional —
    // a new shop has none until the owner makes one, and returning null for
    // that shipped a blank home page on every fresh install.
    return null
  }

  return (
    <>
      <Hero />
      {collections?.length ? (
        <div className="brand-section">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      ) : null}
    </>
  )
}
