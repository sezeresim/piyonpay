# Contributing to PiyonPay

Thanks for helping improve PiyonPay. This guide covers local setup, coding standards, and how we ship changes.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10.22+
- Docker (MongoDB / full stack)

## Repository layout

```text
apps/server     NestJS API + Socket.IO
apps/web        React (Vite) client
apps/e2e        Playwright tests
packages/shared Shared TypeScript types, DTOs, socket events
```

## Getting started

```sh
pnpm install
docker compose up -d mongo   # or full stack: docker compose up
cp apps/server/.env.example apps/server/.env
pnpm --filter @piyonpay/shared build
pnpm --filter @piyonpay/server start:dev
pnpm --filter @piyonpay/web dev -- --host 0.0.0.0
```

From the repo root you can also run:

```sh
pnpm dev          # Turbo: shared + server + web
pnpm build
pnpm lint
pnpm test:e2e
```

## Branch strategy

- `main` — stable, release-ready
- Feature branches: `feat/<short-name>`
- Bug fixes: `fix/<short-name>`
- Docs / chore: `docs/<short-name>` or `chore/<short-name>`

Keep branches short-lived and focused on one concern.

## Commit conventions

Use concise, imperative messages (Conventional Commits style):

```text
feat(server): validate env with zod at startup
fix(web): reconnect socket after tab sleep
docs: add architecture diagram
chore: bump turbo
```

Scopes: `server`, `web`, `shared`, `e2e`, `ci`, or omit for cross-cutting changes.

## Pull request workflow

1. Open an issue for non-trivial work when useful.
2. Create a branch from `main`.
3. Keep PRs small and reviewable.
4. Ensure CI is green:
   - Lint (`pnpm lint` — oxlint)
   - Format (`pnpm fmt:check` — oxfmt)
   - Build
   - Unit tests (server)
   - Playwright e2e
5. Describe **why** the change exists and how to verify it.
6. Prefer shared types in `@piyonpay/shared` over duplicating DTOs between apps.

## Coding standards

- TypeScript strict mode; prefer explicit public types in `packages/shared`
- Match existing NestJS / React patterns in each app
- Lint/format from the repo root with **oxlint** / **oxfmt** (see `.oxlintrc.json`, `.oxfmtrc.json`)
- No secrets in git (`.env` is ignored; update `.env.example` when adding vars)
- Socket event names live in `SOCKET_EVENTS` (`@piyonpay/shared`)
- UI: follow existing Tailwind / shadcn patterns; avoid drive-by refactors

## Releases

Versions follow semver tags: `v0.1.0`, `v0.2.0`, `v1.0.0`.

1. Update `CHANGELOG.md`
2. Bump root `package.json` version when cutting a release
3. Tag and push:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The Release workflow creates a GitHub Release from the tag.

## Questions

Use the [Question](.github/ISSUE_TEMPLATE/question.yml) issue template, or open a discussion if available.
