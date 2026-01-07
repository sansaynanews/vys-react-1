# 10 - Migration Checklist (Geçiş Kontrol Listesi)

Bu dokümanda, PHP tabanlı mevcut sistemden Next.js'e geçiş sürecinin adım adım kontrol listesi ve doğrulama adımları yer almaktadır.

---

## İçindekiler

1. [Genel Geçiş Planı](#1-genel-geçiş-planı)
2. [Faz 1: Hazırlık](#2-faz-1-hazırlık)
3. [Faz 2: Altyapı Kurulumu](#3-faz-2-altyapı-kurulumu)
4. [Faz 3: Core Modüller](#4-faz-3-core-modüller)
5. [Faz 4: Modül Geliştirme](#5-faz-4-modül-geliştirme)
6. [Faz 5: Test ve QA](#6-faz-5-test-ve-qa)
7. [Faz 6: Deployment](#7-faz-6-deployment)
8. [Faz 7: Go-Live](#8-faz-7-go-live)
9. [Modül Bazlı Checklist](#9-modül-bazlı-checklist)
10. [Geri Dönüş Planı](#10-geri-dönüş-planı)

---

## 1. Genel Geçiş Planı

### Tahmini Süre: 10-12 Hafta

```
Hafta 1-2   : Hazırlık + Altyapı Kurulumu
Hafta 3-4   : Authentication + Core Components
Hafta 5-6   : Ana Modüller (Randevu, Araç, Personel)
Hafta 7-8   : Diğer Modüller
Hafta 9     : Entegrasyon + Test
Hafta 10    : UAT + Bug Fix
Hafta 11    : Deployment Hazırlık
Hafta 12    : Go-Live + Monitoring
```

### Öncelik Sıralaması

| Öncelik | Modül | Hafta |
|---------|-------|-------|
| 🔴 Kritik | Auth, Dashboard | 3-4 |
| 🟠 Yüksek | Randevu, Araç, Personel | 5-6 |
| 🟡 Orta | Toplantı, Envanter, Evrak | 7 |
| 🟢 Normal | Diğer modüller | 8 |

---

## 2. Faz 1: Hazırlık

### 2.1 Analiz ve Planlama

- [ ] Mevcut PHP kodunun tam analizi yapıldı
- [ ] Tüm sayfaların listesi çıkarıldı (17 sayfa)
- [ ] Tüm API endpoint'lerinin listesi çıkarıldı (12 API)
- [ ] Veritabanı şeması dokümante edildi (20+ tablo)
- [ ] Yetki matrisi dokümante edildi (8 rol)
- [ ] Dosya yükleme alanları belirlendi
- [ ] Üçüncü parti bağımlılıklar tespit edildi

### 2.2 Ortam Hazırlığı

- [ ] Git repository oluşturuldu
- [ ] Branch stratejisi belirlendi (main, develop, feature/*)
- [ ] Development ortamı hazırlandı
- [ ] Staging ortamı hazırlandı
- [ ] CI/CD pipeline tasarlandı
- [ ] Takım erişimleri ayarlandı

### 2.3 Veri Hazırlığı

- [ ] Mevcut veritabanı backup alındı
- [ ] Test veritabanı oluşturuldu
- [ ] Örnek veri seti hazırlandı
- [ ] Veri temizleme gereksinimi belirlendi

---

## 3. Faz 2: Altyapı Kurulumu

### 3.1 Proje Oluşturma

```bash
# Checklist komutları
npx create-next-app@latest valilik-yonetim-nextjs --typescript --tailwind --eslint --app --src-dir
```

- [ ] Next.js projesi oluşturuldu
- [ ] TypeScript yapılandırıldı
- [ ] Tailwind CSS kuruldu
- [ ] ESLint + Prettier ayarlandı
- [ ] Klasör yapısı oluşturuldu

### 3.2 Paket Kurulumları

- [ ] Prisma + @prisma/client
- [ ] next-auth@beta
- [ ] react-hook-form + zod
- [ ] zustand + @tanstack/react-query
- [ ] lucide-react
- [ ] bcryptjs + types
- [ ] date-fns

### 3.3 Veritabanı Bağlantısı

- [ ] Prisma schema oluşturuldu
- [ ] Mevcut DB'den schema çekildi (`npx prisma db pull`)
- [ ] Schema düzenlendi ve optimize edildi
- [ ] Prisma Client generate edildi
- [ ] Bağlantı test edildi

### 3.4 Temel Yapılandırmalar

- [ ] Environment variables (.env) ayarlandı
- [ ] next.config.js yapılandırıldı
- [ ] tailwind.config.ts özelleştirildi
- [ ] TypeScript paths ayarlandı
- [ ] Prisma client singleton oluşturuldu

---

## 4. Faz 3: Core Modüller

### 4.1 Authentication

- [ ] NextAuth.js yapılandırması tamamlandı
- [ ] Credentials Provider eklendi
- [ ] JWT callback'leri yazıldı
- [ ] Session callback'leri yazıldı
- [ ] TypeScript type tanımlamaları eklendi
- [ ] Login sayfası tasarlandı ve kodlandı
- [ ] Logout işlevi eklendi
- [ ] 30 dakika session timeout ayarlandı
- [ ] Middleware route koruması yazıldı

**Doğrulama:**
```bash
# Login testi
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### 4.2 Yetkilendirme

- [ ] Yetki matrisi JavaScript'e aktarıldı
- [ ] Sayfa bazlı yetki kontrolü eklendi
- [ ] Component bazlı yetki kontrolü (CanAccess)
- [ ] API route yetki kontrolü
- [ ] Tüm 8 rol test edildi

### 4.3 Layout ve Navigation

- [ ] Root layout oluşturuldu
- [ ] Dashboard layout oluşturuldu
- [ ] Auth layout oluşturuldu
- [ ] Sidebar component (kategorili menü)
- [ ] Header component
- [ ] Breadcrumb component
- [ ] Loading states
- [ ] Error boundaries

### 4.4 UI Components

- [ ] Button (variants: primary, secondary, danger, ghost)
- [ ] Input (label, error, disabled states)
- [ ] Select component
- [ ] Modal component
- [ ] Toast/Notification system
- [ ] DataTable component
- [ ] Pagination component
- [ ] Loading spinner
- [ ] Confirm dialog
- [ ] Date picker
- [ ] File upload component

### 4.5 State Management

- [ ] Zustand store'ları oluşturuldu
  - [ ] useUIStore
  - [ ] useToastStore
  - [ ] useFilterStore
- [ ] React Query provider eklendi
- [ ] API hooks yazıldı

---

## 5. Faz 4: Modül Geliştirme

### Her modül için standart checklist:

```
□ API Route (GET, POST)
□ API Route [id] (GET, PUT, DELETE)
□ Liste sayfası
□ Detay sayfası (gerekirse)
□ Form component
□ Validation schema (Zod)
□ React Query hooks
□ Yetki kontrolü
□ Responsive tasarım
□ Test
```

---

### 5.1 Dashboard (Ana Sayfa)

- [ ] API: `/api/dashboard` - Günlük özet verileri
- [ ] Bugün/yarın randevular
- [ ] Bugün/yarın toplantılar
- [ ] Aktif araç görevleri
- [ ] İzindeki personeller
- [ ] İstatistik kartları
- [ ] Rol bazlı widget'lar
- [ ] Hızlı erişim linkleri

### 5.2 Makam Randevu

- [ ] API: `/api/randevu`
- [ ] API: `/api/randevu/[id]`
- [ ] Liste sayfası (filtreleme, arama)
- [ ] Randevu ekleme formu
- [ ] Randevu düzenleme
- [ ] Randevu silme
- [ ] Durum güncelleme
- [ ] Takvim görünümü (opsiyonel)
- [ ] Yazdırma özelliği

### 5.3 Araç Yönetimi

- [ ] API: `/api/arac`
- [ ] API: `/api/arac/[id]`
- [ ] API: `/api/arac/gecmis` (hareket geçmişi)
- [ ] Araç listesi
- [ ] Araç ekleme/düzenleme
- [ ] Muayene/sigorta tarihi uyarıları
- [ ] Araç geçmişi görüntüleme
- [ ] Durum renk kodlaması

### 5.4 Personel (İK)

- [ ] API: `/api/personel`
- [ ] API: `/api/personel/[id]`
- [ ] API: `/api/personel/izin`
- [ ] API: `/api/personel/hareket`
- [ ] Personel listesi
- [ ] Personel ekleme/düzenleme
- [ ] CV/özgeçmiş modülü
- [ ] İzin takibi
- [ ] Hareket kayıtları

### 5.5 Toplantı Salonu

- [ ] API: `/api/toplanti-salonu`
- [ ] API: `/api/salon-rezervasyon`
- [ ] Salon listesi
- [ ] Rezervasyon oluşturma
- [ ] Çakışma kontrolü
- [ ] Takvim görünümü

### 5.6 Envanter (Stok)

- [ ] API: `/api/stok`
- [ ] API: `/api/stok/hareket`
- [ ] Stok kartları listesi
- [ ] Stok ekleme/düzenleme
- [ ] Stok hareketi (giriş/çıkış)
- [ ] Minimum stok uyarısı
- [ ] Rapor

### 5.7 Kurum Amirleri

- [ ] API: `/api/kurum-amiri`
- [ ] API: `/api/kurum-amiri/izin`
- [ ] Amir listesi
- [ ] Amir ekleme/düzenleme
- [ ] İzin takibi
- [ ] Fotoğraf yükleme

### 5.8 Muhtar

- [ ] API: `/api/muhtar`
- [ ] API: `/api/muhtar/[id]`
- [ ] Muhtar listesi
- [ ] Muhtar ekleme/düzenleme
- [ ] İlçe/mahalle filtreleme
- [ ] Arama

### 5.9 Evrak Takip

- [ ] API: `/api/evrak`
- [ ] API: `/api/evrak/[id]`
- [ ] Evrak listesi
- [ ] Evrak ekleme
- [ ] Dosya yükleme
- [ ] Durum takibi

### 5.10 Ziyaretler

- [ ] API: `/api/ziyaret/sehit-gazi`
- [ ] API: `/api/ziyaret/kamu`
- [ ] Şehit/gazi ziyaretleri
- [ ] Kamu ziyaretleri
- [ ] Ziyaret ekleme/düzenleme

### 5.11 Günlük Program

- [ ] API: `/api/gunluk-program`
- [ ] Takvim görünümü
- [ ] Program ekleme
- [ ] Sürükle-bırak düzenleme

### 5.12 Protokol/Etkinlik

- [ ] API: `/api/protokol-etkinlik`
- [ ] Etkinlik listesi
- [ ] Etkinlik ekleme

### 5.13 Resmi Davet

- [ ] API: `/api/resmi-davet`
- [ ] Davet listesi
- [ ] Davet ekleme

### 5.14 VIP Ziyaret

- [ ] API: `/api/vip-ziyaret`
- [ ] VIP ziyaret listesi
- [ ] Ziyaret ekleme

### 5.15 Konuşma Metni

- [ ] API: `/api/konusma-metin`
- [ ] Metin listesi
- [ ] Metin ekleme/düzenleme
- [ ] Dosya yükleme

### 5.16 Rehber

- [ ] API: `/api/rehber`
- [ ] Kişi listesi
- [ ] Arama/filtreleme

### 5.17 Yönetim (Admin)

- [ ] API: `/api/kullanici`
- [ ] Kullanıcı listesi
- [ ] Kullanıcı ekleme/düzenleme
- [ ] Şifre sıfırlama
- [ ] Yetki yönetimi
- [ ] Sistem ayarları

---

## 6. Faz 5: Test ve QA

### 6.1 Unit Tests

- [ ] Utility fonksiyonları test edildi
- [ ] Validation schema'ları test edildi
- [ ] Hook'lar test edildi

### 6.2 Integration Tests

- [ ] API route'lar test edildi
- [ ] Authentication akışı test edildi
- [ ] Database işlemleri test edildi

### 6.3 E2E Tests

- [ ] Login/Logout senaryosu
- [ ] CRUD işlemleri
- [ ] Yetki kontrolleri
- [ ] Form validasyonları

### 6.4 Manuel Test

| Test Alanı | Tester | Tarih | Sonuç |
|------------|--------|-------|-------|
| Login/Logout | | | ☐ |
| Dashboard | | | ☐ |
| Randevu CRUD | | | ☐ |
| Araç CRUD | | | ☐ |
| Personel CRUD | | | ☐ |
| Dosya Yükleme | | | ☐ |
| Yetki Kontrol | | | ☐ |
| Responsive | | | ☐ |

### 6.5 Performance Test

- [ ] Lighthouse skoru > 80
- [ ] API yanıt süreleri < 500ms
- [ ] Sayfa yüklenme < 3s
- [ ] Bundle size optimize

### 6.6 Security Test

- [ ] SQL Injection testi
- [ ] XSS testi
- [ ] CSRF koruması
- [ ] Auth bypass testi
- [ ] Rate limiting testi

---

## 7. Faz 6: Deployment

### 7.1 Staging Deployment

- [ ] Staging sunucusu hazırlandı
- [ ] Environment variables ayarlandı
- [ ] Database migration yapıldı
- [ ] SSL sertifikası kuruldu
- [ ] Domain yönlendirmesi yapıldı
- [ ] Test verileri yüklendi
- [ ] Smoke test geçti

### 7.2 Production Hazırlık

- [ ] Production sunucusu hazırlandı
- [ ] Docker yapılandırması tamamlandı
- [ ] Nginx reverse proxy yapılandırıldı
- [ ] SSL sertifikası (Let's Encrypt)
- [ ] Firewall kuralları
- [ ] Backup stratejisi belirlendi
- [ ] Monitoring araçları kuruldu
- [ ] Alerting yapılandırıldı

### 7.3 Data Migration

- [ ] Production DB backup alındı
- [ ] Migration script hazırlandı
- [ ] Test ortamında migration test edildi
- [ ] Rollback planı hazırlandı

---

## 8. Faz 7: Go-Live

### 8.1 Go-Live Checklist

**D-7 (Bir Hafta Önce)**
- [ ] Final UAT tamamlandı
- [ ] Tüm bug'lar kapatıldı
- [ ] Dokümantasyon güncellendi
- [ ] Kullanıcı eğitimi planlandı

**D-1 (Bir Gün Önce)**
- [ ] Son production backup alındı
- [ ] Maintenance sayfası hazırlandı
- [ ] İletişim planı hazırlandı
- [ ] On-call ekip belirlendi

**D-Day (Geçiş Günü)**
- [ ] PHP sistemi bakım moduna alındı
- [ ] Son anlık backup alındı
- [ ] DNS değişikliği yapıldı (TTL düşürülmüş olmalı)
- [ ] Next.js uygulaması production'a alındı
- [ ] Health check geçti
- [ ] Kritik akışlar test edildi
- [ ] Kullanıcılara bilgi verildi

**D+1 (Ertesi Gün)**
- [ ] Log'lar incelendi
- [ ] Performance metrikleri kontrol edildi
- [ ] Kullanıcı geri bildirimleri toplandı
- [ ] Acil bug'lar düzeltildi

### 8.2 Rollback Prosedürü

```bash
# 1. DNS'i eski sunucuya yönlendir
# 2. PHP sistemini aktif et
# 3. Geçiş sırasında oluşan verileri kaydet
# 4. Root cause analizi yap
```

---

## 9. Modül Bazlı Checklist

### Modül Tamamlanma Durumu

| # | Modül | API | Sayfa | Test | Prod |
|---|-------|-----|-------|------|------|
| 1 | Auth | ☐ | ☐ | ☐ | ☐ |
| 2 | Dashboard | ☐ | ☐ | ☐ | ☐ |
| 3 | Randevu | ☐ | ☐ | ☐ | ☐ |
| 4 | Araç | ☐ | ☐ | ☐ | ☐ |
| 5 | Personel | ☐ | ☐ | ☐ | ☐ |
| 6 | Toplantı | ☐ | ☐ | ☐ | ☐ |
| 7 | Envanter | ☐ | ☐ | ☐ | ☐ |
| 8 | K. Amirleri | ☐ | ☐ | ☐ | ☐ |
| 9 | Muhtar | ☐ | ☐ | ☐ | ☐ |
| 10 | Evrak | ☐ | ☐ | ☐ | ☐ |
| 11 | Ziyaretler | ☐ | ☐ | ☐ | ☐ |
| 12 | G. Program | ☐ | ☐ | ☐ | ☐ |
| 13 | Protokol | ☐ | ☐ | ☐ | ☐ |
| 14 | R. Davet | ☐ | ☐ | ☐ | ☐ |
| 15 | VIP Ziyaret | ☐ | ☐ | ☐ | ☐ |
| 16 | K. Metin | ☐ | ☐ | ☐ | ☐ |
| 17 | Rehber | ☐ | ☐ | ☐ | ☐ |
| 18 | Yönetim | ☐ | ☐ | ☐ | ☐ |

---

## 10. Geri Dönüş Planı

### Kritik Sorun Durumunda

1. **Seviye 1 - Minor Bug**
   - Hotfix branch oluştur
   - Düzelt ve deploy et
   - PHP'ye dönme yok

2. **Seviye 2 - Major Bug**
   - Etkilenen modülü devre dışı bırak
   - PHP'den o modüle yönlendir
   - Acil düzeltme yap

3. **Seviye 3 - Kritik/Sistem Çökmesi**
   - DNS'i PHP sunucusuna çevir
   - Kullanıcıları bilgilendir
   - Root cause analizi
   - Düzeltme planı hazırla

### İletişim Planı

| Durum | Kim | Nasıl | Ne Zaman |
|-------|-----|-------|----------|
| Planlı Bakım | Tüm kullanıcılar | Email + Sistem mesajı | 1 gün önce |
| Acil Bakım | Yöneticiler | SMS/Telefon | Hemen |
| Sorun Çözüldü | Tüm kullanıcılar | Email | Çözüm sonrası |

---

## Sonuç

Bu checklist, PHP'den Next.js'e geçiş sürecinin tüm adımlarını kapsamaktadır. Her adım tamamlandığında işaretlenmeli ve tarih/sorumlu kaydedilmelidir.

### Başarı Kriterleri

- ✅ Tüm özellikler %100 çalışıyor
- ✅ Performans mevcut sistemden iyi veya eşit
- ✅ Güvenlik açığı yok
- ✅ Kullanıcı eğitimi tamamlandı
- ✅ Dokümantasyon güncel
- ✅ Monitoring aktif

### Destek ve İletişim

Geçiş sürecinde sorularınız için:
- Teknik: [teknik@example.com]
- Proje Yönetimi: [pm@example.com]

---

**Doküman Sonu**

Tüm yönerge dökümanları:
1. [00-ANA-YONERGE.md](./00-ANA-YONERGE.md)
2. [01-PROJE-KURULUM.md](./01-PROJE-KURULUM.md)
3. [02-PROJE-YAPISI.md](./02-PROJE-YAPISI.md)
4. [03-VERITABANI-PRISMA.md](./03-VERITABANI-PRISMA.md)
5. [04-AUTHENTICATION.md](./04-AUTHENTICATION.md)
6. [05-API-ROUTES.md](./05-API-ROUTES.md)
7. [06-SAYFALAR-VE-COMPONENTLER.md](./06-SAYFALAR-VE-COMPONENTLER.md)
8. [07-MEVCUT-MODUL-LISTESI.md](./07-MEVCUT-MODUL-LISTESI.md)
9. [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md)
10. [09-DEPLOYMENT.md](./09-DEPLOYMENT.md)
11. [10-MIGRATION-CHECKLIST.md](./10-MIGRATION-CHECKLIST.md) (Bu dosya)
