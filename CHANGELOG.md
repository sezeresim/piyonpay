# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-03

### Added

- pnpm workspace + Turborepo monorepo (`apps/*`, `packages/*`)
- `@piyonpay/shared` package for room types, DTOs, avatars, and socket events
- Zod environment validation at API startup
- Granular Socket.IO events (`player:joined`, `player:left`, `player:ready`, `game:started`, `transfer:created`, `bank:updated`, `room:closed`, `room:deleted`)
- Root GitHub Actions CI (lint, build, unit tests, Playwright e2e)
- Full-stack Docker Compose (`mongo`, `server`, `web`)
- `CONTRIBUTING.md`, issue templates, and release workflow

### Changed

- Repository layout: `piyonpay-server` → `apps/server`, `piyonpay-ui` → `apps/web`, `tests` → `apps/e2e`

[0.1.0]: https://github.com/sezeresim/piyonpay/releases/tag/v0.1.0
