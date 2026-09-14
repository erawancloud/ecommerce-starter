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
 * **There are no `rewrites()` here, and that is the second version of this
 * file.** The first one proxied /app, /admin, /auth and /static to the backend
 * from here, and it shipped a shop whose admin dashboard answered 500: with
 * `output: "standalone"`, next.config.js is evaluated at *build* time and its
 * rewrite table is frozen into the build manifest, so the address baked in was
 * the `http://localhost:9000` fallback rather than the sibling Service the
 * platform names at run time. The same mistake CLAUDE.md records under "if it
 * was stored when it was created, do not work it out again", facing the other
 * way. The proxy is a route handler now — src/app/(proxy) — which resolves the
 * address per request.
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
