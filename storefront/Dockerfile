# The storefront, and the shop's only public hostname.
#
# It also proxies /app, /admin, /auth and /static back to the Medusa component
# over the cluster network — see the comment at the top of next.config.js for
# why that is a platform constraint rather than a preference.
FROM erawan-registry.erawan.svc.cluster.local:5000/mirror/node-alpine:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# next/font downloads and self-hosts the four faces at build time, so a
# visitor's browser never asks Google for anything. That needs the network
# during the build, which BuildKit has and the running container does not.
RUN npm run build


FROM erawan-registry.erawan.svc.cluster.local:5000/mirror/node-alpine:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# `output: "standalone"` traces exactly the files the server needs, so this
# image carries neither the build toolchain nor the two thirds of node_modules
# nothing imports at run time.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 8000
CMD ["node", "server.js"]
