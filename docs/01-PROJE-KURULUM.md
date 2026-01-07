# 01 - Proje Kurulum Yönergesi

## 📦 Adım 1: Next.js Projesi Oluşturma

```bash
# Next.js 14+ projesi oluştur
npx create-next-app@latest valilik-yonetim-nextjs

# Sorulara şu şekilde cevap verin:
# ✔ Would you like to use TypeScript? → Yes
# ✔ Would you like to use ESLint? → Yes
# ✔ Would you like to use Tailwind CSS? → Yes
# ✔ Would you like to use `src/` directory? → Yes
# ✔ Would you like to use App Router? → Yes
# ✔ Would you like to customize the default import alias? → Yes (@/*)
```

```bash
cd valilik-yonetim-nextjs
```

---

## 📦 Adım 2: Gerekli Paketlerin Kurulumu

### Ana Bağımlılıklar

```bash
# Prisma ORM (Veritabanı)
pnpm add prisma @prisma/client

# Authentication
pnpm add next-auth@beta

# Form Yönetimi
pnpm add react-hook-form @hookform/resolvers zod

# State Management
pnpm add zustand @tanstack/react-query

# Utility
pnpm add bcryptjs jsonwebtoken dayjs
pnpm add clsx tailwind-merge class-variance-authority

# Icons
pnpm add lucide-react
# veya FontAwesome kullanmak isterseniz:
pnpm add @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome

# UI Components (Opsiyonel - shadcn/ui)
pnpm dlx shadcn-ui@latest init
```

### Dev Dependencies

```bash
pnpm add -D @types/bcryptjs @types/jsonwebtoken
pnpm add -D prettier prettier-plugin-tailwindcss
```

---

## 📦 Adım 3: Prisma Kurulumu

```bash
# Prisma başlat
npx prisma init

# Bu komut şunları oluşturur:
# - prisma/schema.prisma (veritabanı şeması)
# - .env (environment değişkenleri)
```

### .env Dosyası Ayarları

```env
# .env
DATABASE_URL="mysql://root:@localhost:3306/valilik_yonetim"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-minimum-32-karakter-olmali"

# JWT
JWT_SECRET="jwt-secret-key-minimum-32-karakter"
```

---

## 📦 Adım 4: Prisma Schema (Temel)

`prisma/schema.prisma` dosyasını düzenleyin:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Kullanıcılar tablosu
model Kullanici {
  id              Int       @id @default(autoincrement())
  kadi            String    @unique @db.VarChar(50)
  sifre           String    @db.VarChar(255)
  yetki           String    @db.VarChar(50)
  ozel_yetkiler   String?   @db.Text
  olusturma_tarihi DateTime @default(now())
  
  @@map("kullanicilar")
}

// Diğer tablolar 03-VERITABANI-PRISMA.md dosyasında detaylı
```

### Mevcut Veritabanından Schema Çekme

```bash
# Mevcut MySQL veritabanından schema çek (introspection)
npx prisma db pull

# Prisma Client oluştur
npx prisma generate
```

---

## 📦 Adım 5: Klasör Yapısını Oluşturma

```bash
# Gerekli klasörleri oluştur
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(dashboard\)
mkdir -p src/app/api/auth
mkdir -p src/app/api/arac
mkdir -p src/app/api/envanter
mkdir -p src/app/api/evrak
mkdir -p src/app/api/ik
mkdir -p src/app/api/kurum
mkdir -p src/app/api/randevu
mkdir -p src/app/api/toplanti
mkdir -p src/app/api/muhtar
mkdir -p src/app/api/ziyaret
mkdir -p src/app/api/dashboard
mkdir -p src/app/api/yonetim

mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/forms
mkdir -p src/components/tables
mkdir -p src/components/modals

mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/stores
mkdir -p src/types
mkdir -p src/utils
```

---

## 📦 Adım 6: Temel Konfigürasyon Dosyaları

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          600: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
```

### src/lib/prisma.ts

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### src/lib/utils.ts

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
```

---

## 📦 Adım 7: Geliştirme Sunucusunu Başlatma

```bash
# Geliştirme sunucusunu başlat
pnpm dev

# Tarayıcıda aç: http://localhost:3000
```

---

## 📦 Adım 8: VS Code Ayarları (Önerilen)

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

`.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss"
  ]
}
```

---

## ✅ Kurulum Kontrol Listesi

- [ ] Node.js 20+ kurulu
- [ ] Next.js projesi oluşturuldu
- [ ] Tüm paketler kuruldu
- [ ] Prisma başlatıldı
- [ ] .env dosyası yapılandırıldı
- [ ] Klasör yapısı oluşturuldu
- [ ] `pnpm dev` çalışıyor

---

## ➡️ Sonraki Adım

[02-PROJE-YAPISI.md](./02-PROJE-YAPISI.md) - Detaylı klasör yapısı ve dosya organizasyonu
