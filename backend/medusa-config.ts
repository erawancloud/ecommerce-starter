import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "production", process.cwd())

/**
 * Two origins, which is how Medusa runs everywhere.
 *
 * `ADMIN_URL` is this server: the Store API, the Admin API, `/auth`, the admin
 * dashboard at `/app` and uploaded photos at `/static`. `STORE_URL` is the
 * shop customers see. The admin is served from this origin and talks to this
 * origin, so `admin.backendUrl` stays unset — the bundler defaults it to "",
 * meaning same origin, which is now literally true.
 *
 * The storefront reaches this server over the cluster network rather than
 * through either hostname (`ERAWAN_COMPONENT_BACKEND_URL`), so `storeCors`
 * matters only for a browser calling the Store API directly — a LIFF page, a
 * mobile app — which is a thing a shop may want and costs nothing to allow.
 */
const storeUrl = (process.env.STORE_URL || "").replace(/\/+$/, "")
const adminUrl = (process.env.ADMIN_URL || "").replace(/\/+$/, "")
const cors = [storeUrl, adminUrl, process.env.EXTRA_CORS, "http://localhost:8000"]
  .filter(Boolean)
  .join(",")

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // The add-on's Postgres is inside the cluster and speaks plain TCP. Left
    // to itself node-postgres reads `PGSSLMODE` and whatever is in the URL;
    // saying it here means a laptop and the cluster behave the same way.
    databaseDriverOptions: { connection: { ssl: false } },
    // One pod, one process: the HTTP server and the job worker are the same
    // Node process. `server` would leave every scheduled job and every
    // subscriber unrun while looking perfectly healthy — the shape CLAUDE.md's
    // "a check that asks 'is there something'" section is about.
    workerMode: "shared",
    http: {
      storeCors: cors,
      adminCors: cors,
      authCors: cors,
      // No fallback to "supersecret": both are declared in erawan.yaml and the
      // container refuses to start without them (see erawan-entrypoint.sh).
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    // Served here and reached through the storefront at https://<app>/app.
    path: "/app",
    // backendUrl deliberately unset — see the comment on `storeUrl` above.
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            // Three ways a Thai shop actually gets paid, none of which needs a
            // payment gateway, a contract, or a percentage. See
            // src/modules/thai-payments/README.md for what each one promises.
            resolve: "./src/modules/thai-payments",
            id: "th",
          },
        ],
      },
    },
    {
      // Uploaded product photos. `DATA_DIR` is the Erawan disk, mounted at
      // /data; without it every photo the owner uploads is erased by the next
      // deploy, which is the failure that looks like the platform losing data.
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: `${process.env.DATA_DIR || "."}/static`,
              private_upload_dir: `${process.env.DATA_DIR || "."}/private`,
              // **Absolute, and it has to be.** `LocalFileService` builds
              // every upload's URL with `new URL(backend_url + …)`, so a
              // relative "/static" throws `Invalid URL` from inside the file
              // module and surfaces as a 500 on the upload with nothing in the
              // message about a path. That was tried first, and is why
              // ADMIN_URL is required by erawan-entrypoint.sh rather than
              // defaulted.
              //
              // This server's own origin: the admin uploads a photo and reads
              // it back from the same host, and the storefront shows it from
              // another. `images.unoptimized` in the storefront is what keeps
              // that from needing a `remotePatterns` entry naming a hostname
              // nothing knows at build time.
              backend_url: `${adminUrl}/static`,
            },
          },
        ],
      },
    },
  ],
})
