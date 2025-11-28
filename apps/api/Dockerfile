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

# Create a minimal deployable bundle (app code + production deps)
RUN pnpm deploy --filter @leadlah/api --prod /out

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy only the deployable output
COPY --from=builder /out ./

EXPOSE 3001
CMD ["node", "dist/main.js"]
