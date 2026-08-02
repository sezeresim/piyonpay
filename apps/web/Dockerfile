FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @piyonpay/web...

FROM base AS build
COPY --from=deps /app /app
COPY packages/shared packages/shared
COPY apps/web apps/web
ARG VITE_API_BASE=
ARG VITE_SOCKET_BASE=
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_SOCKET_BASE=$VITE_SOCKET_BASE
RUN pnpm --filter @piyonpay/shared build \
  && pnpm --filter @piyonpay/web build

FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
