# Mridora Frontend

--
Goal
- Make the existing MRIDORA frontend (artifacts/mridora) start and run with docker compose up and produce the same site as the current Vite dev server.
- Keep the site frontend-only: no API server, no database required.
- Ensure the repo remains deployable to Vercel (static deployment) without errors (the Vercel build command runs and produces artifacts/mridora/dist/public).
- Preserve current UI & enquiry behavior (mailto or client-side email service).
- Remove or avoid all workspace-only references that break remote builds (no workspace:../../lib references during Vercel build).
- Languages/stack: Node (build) and React (frontend). All code changes and artifacts should be consistent with a Node + React project.

High-level approach
1. Create a production Dockerfile for the frontend using a multi-stage build:
   - Build stage: Node (use Node 22 LTS for compatibility) to install pnpm and run pnpm install & pnpm build for the frontend package.
   - Serve stage: lightweight nginx (or static file server) to serve the built static site.
   - Explicitly document that Docker + docker-compose is for local and production-like serving; Vercel will still use pnpm build and static files.
2. Add docker-compose.yml at repo root to build & run the frontend container with docker compose up --build mapping host port 21179 -> container port 80.
3. Ensure artifacts/mridora package is self-contained for Vercel builds:
   - Remove any workspace:* dependencies (e.g., @workspace/api-client-react) if unused.
   - Remove any tsconfig "references" that point outside the package.
   - Ensure local helpers (e.g., src/lib/utils.ts) exist and all imports are relative or package-safe.
4. Add vercel.json to point Vercel at the frontend build command and output directory.
5. Add .dockerignore and optional nginx config for SPA rewrites.
6. Document exact commands to run locally and to deploy on Vercel.
7. Validate locally: pnpm install, pnpm --filter @workspace/mridora run build, docker compose up --build, verify site at http://localhost:21179.
8. Commit and push changes with clear messages.

Exact files to create or update (templates included; adjust paths if your workspace differs)

1) artifacts/mridora/Dockerfile
- Multi-stage for Node (build) and nginx (runtime):
```
# Stage 1 — build using Node (LTS 22)
FROM node:22-bullseye AS build

# Make sure corepack & pnpm are available
RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /app

# Copy minimum files required for pnpm to install the frontend package
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/mridora/package.json artifacts/mridora/tsconfig.json artifacts/mridora/vite.config.ts ./artifacts/mridora/
# Copy frontend source
COPY artifacts/mridora/src ./artifacts/mridora/src
COPY artifacts/mridora/index.html ./artifacts/mridora/index.html
COPY artifacts/mridora/public ./artifacts/mridora/public

WORKDIR /app/artifacts/mridora

# Install and build using pnpm (Node + React)
RUN pnpm install --frozen-lockfile --silent
RUN pnpm run build

# Stage 2 — runtime (serve static files)
FROM nginx:stable-alpine AS runtime

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend
COPY --from=build /app/artifacts/mridora/dist/public /usr/share/nginx/html

# If SPA routing required, copy a custom nginx config (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O- http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

2) docker-compose.yml (repo root)
```
version: "3.9"

services:
  frontend:
    build:
      context: .
      dockerfile: artifacts/mridora/Dockerfile
    image: mridora-frontend:latest
    container_name: mridora-frontend
    ports:
      - "21179:80"
    restart: unless-stopped
    environment:
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "wget", "-q", "-O-", "http://localhost"]
      interval: 30s
      timeout: 5s
      retries: 3
```

3) .dockerignore (repo root)
```
node_modules
dist
.artifacts
.git
.vscode
*.log
pnpm-store
.replit
replit.md
```

4) Optional nginx.conf (artifacts/mridora/nginx.conf)
```
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

5) vercel.json (repo root)
```
{
  "version": 2,
  "framework": "vite",
  "installCommand": "corepack enable && pnpm install",
  "buildCommand": "pnpm --filter @workspace/mridora run build",
  "outputDirectory": "artifacts/mridora/dist/public"
}
```

6) .vercelignore (repo root)
```
artifacts/api-server
artifacts/mockup-sandbox
lib
scripts
node_modules
.replit
replit.md
```

7) artifacts/mridora/package.json changes (ensure):
- scripts:
```
"scripts": {
  "dev": "vite --config vite.config.ts --host 0.0.0.0",
  "build": "vite build --config vite.config.ts",
  "serve": "vite preview --config vite.config.ts --host 0.0.0.0"
... have attached the logo and view of website which i want

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/537c1ead-1291-4c5d-8079-33ae77fe3fdf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
