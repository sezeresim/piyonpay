# PiyonPay - Teknik Yol Haritası ve Geliştirilecek Alanlar (TODO)

Bu doküman, PiyonPay projesinin mevcut durumundaki eksiklikleri, kapatılması gereken teknik borçları ve sistemin daha ölçeklenebilir, güvenli ve akıcı hale gelmesi için tamamlanması gereken görevleri listelemektedir.

## 🔴 Kritik Öncelikli: Arka Plan (Backend) Eksikleri

- [ ] **MongoDB İşlem Bütünlüğü (ACID Transactions):**
  - **Sorun:** `send-money-button.tsx` üzerinden tetiklenen para/varlık transferleri şu an atomik değil.
  - **Çözüm:** Bakiye düşme ve karşıya ekleme işlemleri MongoDB session/transaction yapısı içine alınacak. İşlem yarıda kesilirse tam `rollback` yapılacak.
- [ ] **WebSocket Veri Doğrulaması:**
  - **Sorun:** `rooms.gateway.ts` üzerinden gelen anlık veriler yeterince doğrulanmıyor, manipülasyona açık.
  - **Çözüm:** WebSocket Gateway'e NestJS `ValidationPipe` eklenecek ve tüm payload'lar DTO'lar aracılığıyla strict (katı) tip kontrolünden geçirilecek.
- [ ] **Hız Sınırlandırması (Rate Limiting):**
  - **Sorun:** Lobiye spam istek atılması veya saniyede yüzlerce para gönderme isteği sunucuyu yorabilir.
  - **Çözüm:** NestJS `ThrottlerModule` hem HTTP REST endpoint'leri hem de WebSocket event'leri için yapılandırılacak.

---

## 🟡 Orta Öncelikli: Ön Yüz (Frontend) & UX Eksikleri

- [ ] **Ağ Kesintisi Yönetimi (Graceful Reconnection):**
  - **Sorun:** Kullanıcı `game-view.tsx` ekranındayken interneti anlık koparsa oyun içi durum bozuluyor veya çöküyor.
  - **Çözüm:** Socket.io'nun `disconnect` ve `reconnect` olayları yakalanarak ekrana "Yeniden bağlanılıyor..." overlay'i eklenecek. Bağlantı gelene kadar kullanıcı aksiyonları bloke edilecek.
- [ ] **İyimser Arayüz (Optimistic UI) Geçişi:**
  - **Sorun:** Kullanıcı bir etkileşime girdiğinde arayüz sunucudan yanıt gelene kadar bekliyor/donuyor.
  - **Çözüm:** İşlemler anında UI'a yansıtılacak (örn. bakiye hemen düşecek), sunucudan hata gelirse önceki State'e (duruma) geri dönülecek.
- [ ] **Gereksiz Render'ların Önlenmesi:**
  - **Sorun:** WebSocket'ten gelen sık olaylar (event spam) React/Vite tarafında tüm DOM'u yeniden render edebilir.
  - **Çözüm:** State yönetimi (Zustand/Jotai) sadece değişen spesifik komponentleri render edecek şekilde (selector'lar kullanılarak) optimize edilecek.

---

## 🔵 Düşük Öncelikli: Test Otomasyonu (Playwright) Eksikleri

- [ ] **Gerçek Zamanlı Multiplayer Test Senaryoları:**
  - **Sorun:** `multiplayer.spec.ts` şu an iki farklı kullanıcının aynı anda birbirini görmesini tam simüle etmiyor.
  - **Çözüm:** Playwright'ın `browser.newContext()` özelliği ile aynı test bloğunda iki farklı izole oturum (Player A ve Player B) açılıp eşzamanlı etkileşimleri test edilecek.
- [ ] **Ağ İsteklerini Mocklama (Network Mocking):**
  - **Sorun:** UI testleri (`navigation.spec.ts`) backend'in ayakta olmasına bağımlı ve yavaş çalışıyor.
  - **Çözüm:** Playwright `page.route()` kullanılarak dış API ve Socket yanıtları mocklanacak, test süreleri hızlandırılacak.
