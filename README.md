# PiyonPay

**Digital game bank** for tabletop nights — create a room, share a code, move money in real time. No physical bank, no phone calculator math wars.

PiyonPay is a small full-stack MVP: a NestJS + Socket.IO API with MongoDB persistence, and a React (Vite) client for banker and players on separate devices.

## Features

- Create a room as **banker** with starting cash, bank vault, max players, and a 4-digit PIN
- Join from another device with room code + PIN
- Lobby readiness; start when the banker approves and players are ready
- Live balances and instant player-to-player / bank / “pay everyone” transfers
- Banker can issue or remove money from the vault
- Transaction history and realtime `room:updated` sync over Socket.IO
- Per-device **seat tokens** (create/join secrets) for mutating actions
- Leave (players), close + admin-hold, and finalize (banker)
- Rooms persist in MongoDB and expire after inactivity (sliding TTL, default 24h)

## Stack

| Layer | Tech |
|-------|------|
| UI | React 19, Vite, Tailwind CSS, Radix / shadcn, Socket.IO client |
| API | NestJS, Socket.IO, MongoDB |
| Tooling | TypeScript, pnpm, Docker Compose (Mongo) |

## Repository layout

```text
piyonpay/
├── piyonpay-server/   # NestJS API + Socket.IO
├── piyonpay-ui/       # React client
├── LICENSE
└── README.md
```

## Prerequisites

- Node.js 20+ (recommended)
- [pnpm](https://pnpm.io/)
- Docker (for local MongoDB)

## Quick start

### 1. MongoDB

```sh
cd piyonpay-server
docker compose up -d
cp .env.example .env
```

Compose exposes Mongo on host port **27018** (see `.env.example`).

### 2. API

```sh
cd piyonpay-server
pnpm install
pnpm start:dev
```

API listens on `http://0.0.0.0:3000` by default.

Health check: `GET /api/health`

### 3. UI

```sh
cd piyonpay-ui
pnpm install
pnpm dev --host 0.0.0.0
```

Open `http://localhost:5173`.

In development, Vite proxies `/api` to Nest. Socket.IO connects to the same hostname on port `3000` (so phones on LAN work without extra env).

### Same Wi‑Fi, another phone

1. Start API and UI as above (`--host 0.0.0.0` on the UI).
2. On the other device, open `http://YOUR_LAN_IP:5173`.
3. Optional overrides (see `piyonpay-ui/.env.example`):

```sh
VITE_API_BASE=http://YOUR_LAN_IP:3000 \
VITE_SOCKET_BASE=http://YOUR_LAN_IP:3000 \
pnpm dev --host 0.0.0.0
```

## Environment

### Server (`piyonpay-server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://127.0.0.1:27018/piyonpay` | Mongo connection string |
| `PORT` | `3000` | HTTP port |
| `ROOM_TTL_HOURS` | `24` | Sliding TTL after last room activity |
| `ROOM_ADMIN_HOLD_MINUTES` | `15` | After close, banker-only hold before auto-delete |

Copy from `.env.example`. Do not commit real `.env` files.

### UI (optional — `piyonpay-ui/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE` | Absolute API origin when not using the Vite proxy |
| `VITE_SOCKET_BASE` | Absolute Socket.IO origin (defaults to `hostname:3000` in dev) |

## Auth model

- Create/join responses include `playerId` + `playerToken`
- The token is stored on the device (`localStorage`) and required for ready/start/transfer/banker/leave/close/finalize and for loading room state
- Tokens are never broadcast on Socket.IO or included in public player lists
- PIN is still required to join; it is not a substitute for the seat token

## API overview

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness + Mongo status |
| `POST` | `/api/rooms` | Create room (returns `playerToken`) |
| `GET` | `/api/rooms/:code?token=` | Room snapshot (member only) |
| `POST` | `/api/rooms/:code/join` | Join (returns `playerToken`) |
| `POST` | `/api/rooms/:code/ready` | Toggle ready (`{ token, ready }`) |
| `POST` | `/api/rooms/:code/start` | Start game (`{ token }`) |
| `POST` | `/api/rooms/:code/transfers` | Instant transfer (`{ token, toPlayerId, amount }`) |
| `POST` | `/api/rooms/:code/banker-actions` | Issue / remove money |
| `POST` | `/api/rooms/:code/leave` | Player leave |
| `POST` | `/api/rooms/:code/close` | Banker close (kick others, admin hold) |
| `POST` | `/api/rooms/:code/finalize` | Banker delete after close |

### Realtime

- Client emits `room:join` with `{ "code": "ABX92F", "token": "…" }`
- Server emits `room:updated` to the room on player, balance, or history changes

## Scripts

**Server**

```sh
pnpm start:dev   # watch mode
pnpm build
pnpm start
pnpm lint
```

**UI**

```sh
pnpm dev
pnpm build
pnpm preview
pnpm lint
```

## License

This project is licensed under the [MIT License](LICENSE) — Copyright © 2026 Sezer Esim.

## Contributing

Issues and pull requests are welcome. Keep changes focused; match existing TypeScript and UI patterns in each package.
