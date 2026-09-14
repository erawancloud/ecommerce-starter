# Medusa 2 for a Thai shop. Two stages: one that compiles the server and the
# admin dashboard, one that carries only what runs.
#
# `node:22-alpine` is already mirrored into our own registry for the Strapi
# template (app_templates/base-images.json), so nothing here pulls from Docker
# Hub on a deploy — which is the difference between a 5-minute and a 9-minute
# first build (infra/mirror-starters.sh, measured 2026-09-08).
FROM erawan-registry.erawan.svc.cluster.local:5000/mirror/node-alpine:22-alpine AS build
WORKDIR /app

# Medusa itself is pure JS, but a few transitive packages still compile.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Nothing about a customer's shop is reported anywhere. Set in both stages
# because the CLI asks at build time and the server asks at boot.
ENV MEDUSA_DISABLE_TELEMETRY=true

# Compiles src/ to .medusa/server and bundles the admin dashboard into
# .medusa/server/public/admin. The admin's backendUrl is left unset here on
# purpose — see the comment at the top of medusa-config.ts.
RUN npm run build


FROM erawan-registry.erawan.svc.cluster.local:5000/mirror/node-alpine:22-alpine AS runtime
ENV NODE_ENV=production
ENV MEDUSA_DISABLE_TELEMETRY=true
WORKDIR /app

# `medusa build` writes a server with a package.json of its own, holding the
# runtime half of the dependency list. Installing *that* rather than copying
# node_modules across is what keeps the admin's build-time toolchain — vite,
# typescript, @swc — out of the image somebody pays to keep running.
COPY --from=build /app/.medusa/server ./
RUN npm install --omit=dev --no-audit --no-fund \
  && npm cache clean --force

COPY erawan-entrypoint.sh erawan-boot.mjs ./
RUN chmod +x erawan-entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/app/erawan-entrypoint.sh"]
