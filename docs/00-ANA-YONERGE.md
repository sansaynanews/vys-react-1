# 🚀 Valilik Yönetim Sistemi - Next.js Dönüşüm Ana Yönergesi

## 📋 Proje Özeti

Bu dokümantasyon, mevcut PHP tabanlı **Valilik Yönetim Sistemi**'nin **Next.js 14+ (App Router)** ile modern bir full-stack uygulamaya dönüştürülmesi için kapsamlı bir yol haritası sunmaktadır.

---

## 🎯 Dönüşüm Hedefleri

| Hedef | Açıklama |
|-------|----------|
| **Performans** | Server-side rendering, static generation ile hızlı sayfa yüklemeleri |
| **Güvenlik** | JWT tabanlı authentication, CSRF koruması, güvenli API routes |
| **Ölçeklenebilirlik** | Modüler yapı, kolay bakım ve genişletme |
| **UX/UI** | Tailwind CSS ile responsive, modern arayüz |
| **SEO** | SSR ile arama motoru optimizasyonu |
| **DevOps** | Docker, CI/CD entegrasyonu |

---

## 📁 Dokümantasyon Yapısı

```
nextjs-donusum-plani/
│
├── 00-ANA-YONERGE.md              ← 📌 Bu dosya (Ana rehber)
│
├── 01-PROJE-KURULUM.md            ← Proje kurulum adımları
├── 02-PROJE-YAPISI.md             ← Klasör ve dosya organizasyonu
├── 03-VERITABANI-PRISMA.md        ← Prisma ORM ve DB şeması
├── 04-AUTHENTICATION.md           ← NextAuth.js ile kimlik doğrulama
├── 05-API-ROUTES.md               ← API endpoint tasarımı
├── 06-SAYFALAR-VE-COMPONENTLER.md ← Frontend komponentleri
├── 07-MEVCUT-MODUL-LISTESI.md     ← PHP'den Next.js'e modül eşleştirmesi
├── 08-STATE-MANAGEMENT.md         ← Zustand/React Query ile state yönetimi
├── 09-DEPLOYMENT.md               ← Vercel/Docker deployment
└── 10-MIGRATION-CHECKLIST.md      ← Adım adım geçiş kontrol listesi
```

---

## 🔄 Mevcut Sistem → Next.js Eşleştirmesi

### Temel Dönüşümler

| PHP (Mevcut) | Next.js (Yeni) |
|--------------|----------------|
| `index.php` (login) | `app/(auth)/login/page.tsx` |
| `menu.php` (dashboard) | `app/(dashboard)/page.tsx` |
| `auth.php` (session) | `NextAuth.js` + JWT |
| `db.php` (PDO) | `Prisma ORM` |
| `*_api.php` | `app/api/*/route.ts` |
| PHP Sessions | JWT Tokens + Cookies |
| `include 'auth.php'` | Middleware |

### Modül Dönüşümleri

| Mevcut Modül | Next.js Route |
|--------------|---------------|
| `gunluk-program.php` | `/dashboard/gunluk-program` |
| `makam-randevu.php` | `/dashboard/makam-randevu` |
| `toplanti-yonetimi.php` | `/dashboard/toplanti` |
| `arac-planlama.php` | `/dashboard/arac` |
| `envanter.php` | `/dashboard/envanter` |
| `ik-modulu.php` | `/dashboard/ik` |
| `evrak.php` | `/dashboard/evrak` |
| `yonetim.php` | `/dashboard/yonetim` |
| ... | ... |

---

## 🛠️ Teknoloji Stack'i

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS 3.4+
- **Icons:** Lucide React / FontAwesome
- **Forms:** React Hook Form + Zod
- **State:** Zustand + TanStack Query

### Backend
- **Runtime:** Node.js 20+
- **ORM:** Prisma
- **Auth:** NextAuth.js v5 (Auth.js)
- **Validation:** Zod

### Veritabanı
- **Database:** MySQL 8 (mevcut yapı korunacak)
- **Migrations:** Prisma Migrate

### DevOps
- **Deployment:** Vercel / Docker
- **CI/CD:** GitHub Actions

---

## 📅 Tahmini Zaman Çizelgesi

```
Hafta 1-2: Proje kurulumu, Prisma şeması, Auth sistemi
Hafta 3-4: API Routes oluşturma (tüm modüller)
Hafta 5-6: Dashboard ve layout componentleri
Hafta 7-8: Modül sayfalarının dönüşümü
Hafta 9-10: Test, optimizasyon, deployment
```

---

## 🚦 Başlangıç Adımları

### 1. Önkoşullar
```bash
# Node.js 20+ kurulu olmalı
node -v  # v20.x.x

# pnpm (önerilen) veya npm
npm install -g pnpm
```

### 2. Proje Oluşturma
```bash
npx create-next-app@latest valilik-yonetim-nextjs --typescript --tailwind --eslint --app --src-dir
```

### 3. Gerekli Paketler
```bash
cd valilik-yonetim-nextjs
pnpm add prisma @prisma/client
pnpm add next-auth@beta
pnpm add zod react-hook-form @hookform/resolvers
pnpm add zustand @tanstack/react-query
pnpm add bcryptjs jsonwebtoken
pnpm add lucide-react
pnpm add -D @types/bcryptjs @types/jsonwebtoken
```

---

## ⚠️ Önemli Notlar

1. **Veri Kaybı Yok:** Mevcut MySQL veritabanı aynen korunacak
2. **Kademeli Geçiş:** Modüller tek tek dönüştürülebilir
3. **Yetki Sistemi:** Mevcut yetki matrisi korunacak
4. **API Uyumluluğu:** Mevcut API yapısı benzer kalacak

---

## 📚 İlgili Dökümanlar

Aşağıdaki sırayla okuyun:

1. ➡️ [01-PROJE-KURULUM.md](./01-PROJE-KURULUM.md)
2. ➡️ [02-PROJE-YAPISI.md](./02-PROJE-YAPISI.md)
3. ➡️ [03-VERITABANI-PRISMA.md](./03-VERITABANI-PRISMA.md)
4. ➡️ [04-AUTHENTICATION.md](./04-AUTHENTICATION.md)
5. ➡️ [05-API-ROUTES.md](./05-API-ROUTES.md)
6. ➡️ [06-SAYFALAR-VE-COMPONENTLER.md](./06-SAYFALAR-VE-COMPONENTLER.md)
7. ➡️ [07-MEVCUT-MODUL-LISTESI.md](./07-MEVCUT-MODUL-LISTESI.md)
8. ➡️ [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md)
9. ➡️ [09-DEPLOYMENT.md](./09-DEPLOYMENT.md)
10. ➡️ [10-MIGRATION-CHECKLIST.md](./10-MIGRATION-CHECKLIST.md)

---

## 👨‍💻 Geliştirici Notları

- Her modül için ayrı branch açın
- Commit mesajları anlamlı olsun (feat:, fix:, docs:)
- Her PR için en az 1 review alın
- Test coverage %80+ hedefleyin

---

**Son Güncelleme:** Ocak 2026  
**Versiyon:** 1.0.0
