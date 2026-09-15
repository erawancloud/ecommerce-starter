#!/bin/sh
# Medusa on Erawan: migrate, seed once, make an owner, then serve.
#
# Everything here is ordered so that a failure leaves the shop in a state
# somebody can restart from: migrations before anything reads the schema, the
# seed guarded by a marker the seed itself writes last, and the admin user
# created after the seed so it lands in a store that exists.
set -eu

say() { printf '%s\n' "$*" >&2; }

require() {
  eval "value=\${$1:-}"
  if [ -z "$value" ]; then
    say "Missing $1."
    say "$2"
    exit 1
  fi
}

# Declared in erawan.yaml and set on the app's own page (PRODUCT.md §65). No
# fallbacks: a Medusa that silently runs on jwtSecret \"supersecret\" is a shop
# whose admin session anybody can forge.
require JWT_SECRET        "erawan secrets set <app> JWT_SECRET"
require COOKIE_SECRET     "erawan secrets set <app> COOKIE_SECRET"
require BOOTSTRAP_SECRET  "erawan secrets set <app> BOOTSTRAP_SECRET"
require DATABASE_URL      "Add the Postgres add-on: erawan addon add <app> postgres"
require STORE_URL         "erawan env set <app> STORE_URL=https://<app>.erawan.app"
# This server's own address, which is a different host from the shop's since
# the backend got `subdomain: auto`. Uploaded photos are served from it and
# `LocalFileService` builds their URLs with `new URL()`, so a missing value is
# a 500 on the owner's first upload rather than anything readable here.
require ADMIN_URL         "erawan env set <app> ADMIN_URL=https://<app>-backend.erawan.app"

# Product photos and anything else uploaded. DATA_DIR is Erawan's disk; without
# it every photo the owner uploads is erased by the next deploy.
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/static" "$DATA_DIR/private"

# **The upload directory and the served directory are two different settings,
# and nothing tells you when they disagree.** `file-local` writes where
# `upload_dir` says — the Erawan disk — while Medusa serves /static from
# `<cwd>/static` (`framework/dist/http/express-loader.js`). Without this link
# an upload answers 200 with a URL, and that URL 404s for ever: a photo the
# owner watched appear in the admin and can never see on the shop.
if [ ! -L /app/static ]; then
  # Anything a future Medusa ships in there is moved rather than deleted.
  if [ -d /app/static ]; then
    cp -a /app/static/. "$DATA_DIR/static/" 2>/dev/null || true
    rm -rf /app/static
  fi
  ln -s "$DATA_DIR/static" /app/static
fi

say "รอฐานข้อมูล / waiting for Postgres…"
node /app/erawan-boot.mjs wait

say "อัปเดตโครงสร้างฐานข้อมูล / running migrations…"
npx medusa db:migrate

if node /app/erawan-boot.mjs seeded; then
  say "ร้านนี้ตั้งค่าไว้แล้ว ข้ามการ seed / already seeded, skipping."
else
  say "ตั้งค่าร้านครั้งแรก / seeding the shop…"
  npx medusa exec ./src/scripts/seed.js
fi

if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  # `medusa user` fails when the address is already taken, which is the normal
  # case on every boot after the first. The message is printed rather than
  # swallowed, because the other reasons it can fail — a database that is not
  # migrated, a password the validator refuses — look identical from a shell
  # that only checked the exit code.
  say "เจ้าของร้าน / ensuring the admin user exists…"
  npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" 2>&1 | sed 's/^/  /' >&2 || true
fi

say "เปิดร้าน / starting Medusa on ${PORT:-9000}…"
exec npx medusa start -p "${PORT:-9000}" -H 0.0.0.0
