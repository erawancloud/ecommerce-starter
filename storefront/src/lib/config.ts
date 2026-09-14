import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"
import { BACKEND_URL, publishableKey } from "@lib/erawan"

export const sdk = new Medusa({
  baseUrl: BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  // **No publishableKey here.** It is not known when this module is evaluated
  // — see src/lib/erawan.ts — so it is attached per request in the fetch
  // override below, which every call already goes through.
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders: Record<string, any> = {
    ...localeHeader,
    ...headers,
  }
  if (!newHeaders["x-publishable-api-key"]) {
    newHeaders["x-publishable-api-key"] = await publishableKey()
  }
  init = {
    ...init,
    headers: newHeaders,
  }
  return originalFetch(input, init)
}
