# PiyonPay - Teknik Yol Haritası ve Geliştirilecek Alanlar (TODO)

Bu doküman, PiyonPay projesinin mevcut durumundaki eksiklikleri, kapatılması gereken teknik borçları ve sistemin daha ölçeklenebilir, güvenli ve akıcı hale gelmesi için tamamlanması gereken görevleri listelemektedir.

## Kritik Öncelikli: Arka Plan (Backend) Eksikleri

- [x] **MongoDB İşlem Bütünlüğü (ACID Transactions):**
  - Transfer ve banker aksiyonları `MongoService.withTransaction` + session’lı `replaceOne` ile atomik.
  - Docker Mongo tek-node replica set (`rs0`); URI’de `directConnection=true`.
  - Doğrulama: `docker compose up -d mongo`, transfer yap, sunucu loglarında hata olmamalı.
- [x] **WebSocket Veri Doğrulaması:**
  - Shared Zod şemaları (`packages/shared/src/schemas.ts`) + `ZodValidationPipe` (HTTP body + `room:join`).
  - Doğrulama: geçersiz join payload → WsException / 400.
- [x] **Hız Sınırlandırması (Rate Limiting):**
  - `@nestjs/throttler` global guard; transfer/banker için sıkı limit; WS `room:join` throttle.
  - Env: `THROTTLE_TTL_MS`, `THROTTLE_LIMIT`, `THROTTLE_TRANSFER_LIMIT`.

## Orta Öncelikli: Ön Yüz (Frontend) & UX Eksikleri

- [x] **Ağ Kesintisi Yönetimi (Graceful Reconnection):**
  - Socket `disconnect` / `reconnect` → `connectionStatus`; `ConnectionOverlay`; aksiyonlar bloklu.
- [x] **İyimser Arayüz (Optimistic UI) Geçişi:**
  - Transfer / banker aksiyonlarında anında bakiye; hata → snapshot rollback.
- [x] **Gereksiz Render'ların Önlenmesi:**
  - Zustand `roomStore` + `useShallow` selector’lar.

## Düşük Öncelikli: Test Otomasyonu (Playwright) Eksikleri

- [x] **Gerçek Zamanlı Multiplayer Test Senaryoları:**
  - `browser.newContext()` zaten kullanılıyordu; `newCleanPage` helper’a taşındı.
- [x] **Ağ İsteklerini Mocklama (Network Mocking):**
  - `mockApiRoutes` — navigation / home / settings UI-only spec’lerde API stub.
