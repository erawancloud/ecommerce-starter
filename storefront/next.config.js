/**
 * @type {import('next').NextConfig}
 *
 * **Images are unoptimised on purpose.** Next's optimiser runs sharp in this
 * process, and a shop owner uploading a 6MB photo from a phone would be asking
 * a 768Mi container to decode it. Uploaded photos are served straight from the
 * backend's disk through /static, which is the same origin, so nothing here
 * needs `remotePatterns` — a list that would otherwise have to know the app's
 * hostname at build time, which is not knowable when the image is built.
 *
 * **There are no `rewrites()` here, and there is no proxy either — that is the
 * third version of this file.** The first proxied /app, /admin, /auth and
 * /static to the backend with `rewrites()`, and shipped an admin that answered
 * 500: `output: "standalone"` freezes next.config.js into the build, so the
 * address baked in was the localhost fallback rather than the sibling Service
 * the platform names at run time. The second moved it to a route handler,
 * resolved per request, which worked.
 *
 * The third deletes it. The backend has a hostname of its own now
 * (`subdomain: auto` in erawan.yaml), which is how Medusa runs everywhere, so
 * this process serves the shop and nothing else. The proxy only ever existed
 * because the platform could give a template one address.
 */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  experimental: {
    // A transfer slip arrives as a base64 data URL through a server action,
    // and base64 is a third bigger than the file. The API caps the photo at
    // 2MB; this has to clear that with room, or the upload fails in Next
    // before it is ever refused by something that can explain itself.
    serverActions: { bodySizeLimit: "4mb" },
  },
}

module.exports = nextConfig
