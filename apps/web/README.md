# `@piyonpay/web`

React (Vite) client for [PiyonPay](../../README.md).

See the [root README](../../README.md) for full setup and LAN / multi-device notes.

```sh
# from repo root
pnpm install
pnpm --filter @piyonpay/web dev -- --host 0.0.0.0
```

Vite proxies `/api` to Nest in development. Socket.IO uses `hostname:3000` by default.

Licensed under [MIT](../../LICENSE).
