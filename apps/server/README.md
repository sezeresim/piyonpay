# `@piyonpay/server`

NestJS + Socket.IO API for [PiyonPay](../../README.md).

See the [root README](../../README.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md) for setup.

```sh
# from repo root
docker compose up -d mongo
cp apps/server/.env.example apps/server/.env
pnpm install
pnpm --filter @piyonpay/server start:dev
```

Licensed under [MIT](../../LICENSE).
