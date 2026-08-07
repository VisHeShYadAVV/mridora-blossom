# MRIDORA — production image (TanStack Start SSR served by Node)

# ---- Build stage -------------------------------------------------------------
FROM oven/bun:1 AS build
WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Copy the rest of the source and build
COPY . .
# Emit a plain Node server instead of the default Cloudflare Worker output
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production
RUN bun run build

# ---- Runtime stage ----------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# The nitro node-server output is fully bundled — no node_modules needed
COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["node", "dist/server/index.mjs"]
