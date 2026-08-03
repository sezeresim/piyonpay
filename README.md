# PiyonPay

**Digital game bank** for tabletop nights — create a room, share a code, move money in real time. No physical bank, no phone calculator math wars.

PiyonPay is a small full-stack MVP: a NestJS + Socket.IO API with MongoDB persistence, and a React (Vite) client for banker and players on separate devices.

## Features

- Create a room as **banker** with starting cash, bank vault, max players, and a 4-digit PIN
- Join from another device with room code + PIN
- Lobby readiness; start when the banker approves and players are ready
- Live balances and instant player-to-player / bank / “pay everyone” transfers
- Banker can issue or remove money from the vault
- Transaction history and realtime sync over Socket.IO (granular events + reconnect snapshot)
- Per-device **seat tokens** (create/join secrets) for mutating actions
- Leave (players), close + admin-hold, and finalize (banker)
- Rooms persist in MongoDB and expire after inactivity (sliding TTL, default 24h)

## Architecture

```text
┌──────────┐   HTTP / Socket.IO    ┌─────────────────┐
│  Players │ ───────────────────► │  NestJS Server  │
│ (React)  │ ◄─────────────────── │   + Socket.IO   │
└──────────┘   room + player +    └────────┬────────┘
               transfer events             │
                                           ▼
                                    ┌─────────────┐
                                    │   MongoDB   │
                                    └─────────────┘
```

Shared TypeScript contracts live in `packages/shared` (`Room`, `Player`, DTOs, `SOCKET_EVENTS`).

## Stack

| Layer   | Tech                                                                  |
| ------- | --------------------------------------------------------------------- |
| UI      | React 19, Vite, Tailwind CSS, Radix / shadcn, Socket.IO client        |
| API     | NestJS, Socket.IO, MongoDB                                            |
| Shared  | `@piyonpay/shared` (types, DTOs, events)                              |
| Tooling | TypeScript, pnpm workspaces, Turborepo, oxlint, oxfmt, Docker Compose |

## Repository layout

```text
piyonpay/
├── apps/
│   ├── server/        # NestJS API + Socket.IO
│   ├── web/           # React client
│   └── e2e/           # Playwright tests
├── packages/
│   └── shared/        # Shared types & socket contracts
├── docker-compose.yml
├── CONTRIBUTING.md
└── README.md
```

## Prerequisites

- Node.js 20+ (recommended)
- [pnpm](https://pnpm.io/) 10.22+
- Docker (for MongoDB or full stack)

## Quick start

### Option A — Docker (full stack + same Wi‑Fi)

One command runs MongoDB, API, and UI. Nginx proxies `/api` and Socket.IO, so phones on your LAN only need the UI port.

```sh
pnpm docker:up
# or: docker compose up --build
```

- UI (this machine): `http://localhost:5173`
- UI (phone on same Wi‑Fi): `http://YOUR_LAN_IP:5173`
- API (optional): `http://localhost:3000`
- Mongo: host port `27019`

Find your LAN IP (macOS): `ipconfig getifaddr en0`

Stop with `pnpm docker:down` (or `Ctrl+C`, then `docker compose down`).

### Option B — Local development

#### 1. Install & MongoDB

```sh
pnpm install
docker compose up -d mongo
cp apps/server/.env.example apps/server/.env
```

Compose exposes Mongo on host port **27019** (see `apps/server/.env.example`).

#### 2. API + UI

```sh
pnpm --filter @piyonpay/shared build
pnpm --filter @piyonpay/server start:dev
pnpm --filter @piyonpay/web dev -- --host 0.0.0.0
```

Or from the root: `pnpm dev` (Turborepo).

- API: `http://0.0.0.0:3000` — health: `GET /api/health`
- UI: `http://localhost:5173`

In development, Vite proxies `/api` to Nest. Socket.IO connects to the same hostname on port `3000` (so phones on LAN work without extra env).

### Same Wi‑Fi, another phone

1. Start API and UI as above (`--host 0.0.0.0` on the UI).
2. On the other device, open `http://YOUR_LAN_IP:5173`.
3. Optional overrides (see `apps/web/.env.example`):

```sh
VITE_API_BASE=http://YOUR_LAN_IP:3000 \
VITE_SOCKET_BASE=http://YOUR_LAN_IP:3000 \
pnpm --filter @piyonpay/web dev -- --host 0.0.0.0
```

## Environment

Server env is validated with **Zod** at startup (invalid config fails fast).

### Server (`apps/server/.env`)

| Variable                  | Default                                                    | Description                                      |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `MONGODB_URI`             | `mongodb://127.0.0.1:27019/piyonpay?directConnection=true` | Mongo (single-node replica set `rs0`)            |
| `PORT`                    | `3000`                                                     | HTTP port                                        |
| `ROOM_TTL_HOURS`          | `24`                                                       | Sliding TTL after last room activity             |
| `ROOM_ADMIN_HOLD_MINUTES` | `15`                                                       | After close, banker-only hold before auto-delete |
| `THROTTLE_TTL_MS`         | `60000`                                                    | Rate-limit window                                |
| `THROTTLE_LIMIT`          | `60`                                                       | Default requests per window                      |
| `THROTTLE_TRANSFER_LIMIT` | `20`                                                       | Transfer / banker-action limit                   |

Copy from `.env.example`. Do not commit real `.env` files.

### UI (optional — `apps/web/.env`)

| Variable           | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `VITE_API_BASE`    | Absolute API origin when not using the Vite proxy              |
| `VITE_SOCKET_BASE` | Absolute Socket.IO origin (defaults to `hostname:3000` in dev) |

## Auth model

- Create/join responses include `playerId` + `playerToken`
- The token is stored on the device (`localStorage`) and required for ready/start/transfer/banker/leave/close/finalize and for loading room state
- Tokens are never broadcast on Socket.IO or included in public player lists
- PIN is still required to join; it is not a substitute for the seat token

## API overview

| Method | Path                              | Purpose                                            |
| ------ | --------------------------------- | -------------------------------------------------- |
| `GET`  | `/api/health`                     | Liveness + Mongo status                            |
| `POST` | `/api/rooms`                      | Create room (returns `playerToken`)                |
| `GET`  | `/api/rooms/:code?token=`         | Room snapshot (member only)                        |
| `POST` | `/api/rooms/:code/join`           | Join (returns `playerToken`)                       |
| `POST` | `/api/rooms/:code/ready`          | Toggle ready (`{ token, ready }`)                  |
| `POST` | `/api/rooms/:code/start`          | Start game (`{ token }`)                           |
| `POST` | `/api/rooms/:code/transfers`      | Instant transfer (`{ token, toPlayerId, amount }`) |
| `POST` | `/api/rooms/:code/banker-actions` | Issue / remove money                               |
| `POST` | `/api/rooms/:code/leave`          | Player leave                                       |
| `POST` | `/api/rooms/:code/close`          | Banker close (kick others, admin hold)             |
| `POST` | `/api/rooms/:code/finalize`       | Banker delete after close                          |

### Realtime

| Event              | Direction       | When                                            |
| ------------------ | --------------- | ----------------------------------------------- |
| `room:join`        | Client → Server | Subscribe after create/join (`{ code, token }`) |
| `room:updated`     | Server → Client | Full snapshot on (re)connect                    |
| `player:joined`    | Server → Client | Someone joined                                  |
| `player:left`      | Server → Client | Someone left                                    |
| `player:ready`     | Server → Client | Ready toggled                                   |
| `game:started`     | Server → Client | Banker started the game                         |
| `transfer:created` | Server → Client | Transfer completed                              |
| `bank:updated`     | Server → Client | Banker issued/removed money                     |
| `room:closed`      | Server → Client | Banker closed the room                          |
| `room:deleted`     | Server → Client | Room finalized / deleted                        |

Event names and payloads are defined in `@piyonpay/shared` (`SOCKET_EVENTS`).

## Scripts

```sh
pnpm install
pnpm build
pnpm lint              # oxlint (repo-wide)
pnpm fmt               # oxfmt
pnpm fmt:check
pnpm test              # unit tests
pnpm test:e2e          # Playwright
pnpm docker:up         # full stack (Mongo + API + UI)
pnpm docker:down
pnpm --filter @piyonpay/server start:dev
pnpm --filter @piyonpay/web dev
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, commit conventions, and PR workflow.

## License

This project is licensed under the [MIT License](LICENSE) — Copyright © 2026 Sezer Esim.
