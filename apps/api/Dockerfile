# syntax=docker/dockerfile:1.7-labs

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app

# Prime lockfiles for deterministic installs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/

RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY . .

# Build workspace packages then the API
RUN pnpm --filter @leadlah/core build \
 && pnpm --filter @leadlah/api build

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy production dependencies (includes workspace symlinks)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy built artifacts and workspace sources needed by symlinks
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/core ./packages/core

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
