# `@piyonpay/shared`

Shared TypeScript contracts for PiyonPay apps:

- Room / player / transfer / transaction types
- HTTP DTOs
- Avatar IDs + sanitizers
- Socket.IO event names (`SOCKET_EVENTS`)

```sh
pnpm --filter @piyonpay/shared build
```

Import from apps:

```ts
import { SOCKET_EVENTS, type RoomState } from '@piyonpay/shared'
```
