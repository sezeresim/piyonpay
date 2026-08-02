FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile --filter @piyonpay/server...

FROM base AS build
COPY --from=deps /app /app
COPY packages/shared packages/shared
COPY apps/server apps/server
RUN pnpm --filter @piyonpay/shared build \
  && pnpm --filter @piyonpay/server build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build /app/packages/shared /app/packages/shared
COPY --from=build /app/apps/server/package.json /app/apps/server/
COPY --from=build /app/apps/server/dist /app/apps/server/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/server/node_modules /app/apps/server/node_modules

WORKDIR /app/apps/server
EXPOSE 3000
CMD ["node", "dist/main.js"]
