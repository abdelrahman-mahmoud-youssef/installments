FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN pnpm install --frozen-lockfile --filter frontend...

FROM deps AS build
COPY apps/frontend apps/frontend
ENV BACKEND_URL=http://localhost:3001
RUN pnpm --filter frontend build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=build /repo/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /repo/apps/frontend/public ./apps/frontend/public
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/frontend/next.config.ts apps/frontend/next.config.ts
WORKDIR /repo/apps/frontend
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
