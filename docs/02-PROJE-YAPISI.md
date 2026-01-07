# 02 - Proje Yapısı ve Klasör Organizasyonu

## 📁 Tam Klasör Yapısı

```
valilik-yonetim-nextjs/
│
├── 📁 prisma/
│   ├── schema.prisma              # Veritabanı şeması
│   └── migrations/                # Migration dosyaları
│
├── 📁 public/
│   ├── vys.png                    # Logo
│   ├── favicon.ico
│   └── 📁 uploads/                # Yüklenen dosyalar
│       ├── 📁 muhtarlar/
│       ├── 📁 personel/
│       └── 📁 toplanti/
│
├── 📁 src/
│   │
│   ├── 📁 app/                    # Next.js App Router
│   │   │
│   │   ├── 📁 (auth)/             # Auth group (login layout'u)
│   │   │   ├── layout.tsx
│   │   │   ├── 📁 login/
│   │   │   │   └── page.tsx       # /login
│   │   │   └── 📁 logout/
│   │   │       └── page.tsx       # /logout
│   │   │
│   │   ├── 📁 (dashboard)/        # Dashboard group (ana layout)
│   │   │   ├── layout.tsx         # Sidebar + Header layout
│   │   │   ├── page.tsx           # /dashboard (menu)
│   │   │   │
│   │   │   ├── 📁 gunluk-program/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 makam-randevu/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 toplanti/
│   │   │   │   ├── page.tsx
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── page.tsx   # Detay sayfası
│   │   │   │
│   │   │   ├── 📁 vip-ziyaret/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 protokol-etkinlik/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 resmi-davet/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 arac/
│   │   │   │   ├── page.tsx
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── 📁 envanter/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 kurum-amirleri/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 ik/
│   │   │   │   ├── page.tsx
│   │   │   │   └── 📁 personel/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── 📁 muhtar/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 evrak/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 talimat/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 ziyaretler/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 konusma-metin/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 rehber/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── 📁 yonetim/        # Admin paneli
│   │   │       └── page.tsx
│   │   │
│   │   ├── 📁 api/                # API Routes
│   │   │   │
│   │   │   ├── 📁 auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts   # NextAuth handler
│   │   │   │
│   │   │   ├── 📁 arac/
│   │   │   │   ├── route.ts       # GET (list), POST (create)
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   └── route.ts   # GET, PUT, DELETE
│   │   │   │   └── 📁 gecmis/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── route.ts       # Dashboard verileri
│   │   │   │
│   │   │   ├── 📁 envanter/
│   │   │   │   ├── route.ts
│   │   │   │   └── 📁 hareket/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 evrak/
│   │   │   │   ├── route.ts
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 ik/
│   │   │   │   ├── route.ts
│   │   │   │   ├── 📁 personel/
│   │   │   │   │   └── route.ts
│   │   │   │   └── 📁 izin/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 kurum/
│   │   │   │   ├── route.ts
│   │   │   │   └── 📁 izin/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 muhtar/
│   │   │   │   ├── route.ts
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 randevu/
│   │   │   │   ├── route.ts
│   │   │   │   └── 📁 durum/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 toplanti/
│   │   │   │   ├── route.ts
│   │   │   │   ├── 📁 salon/
│   │   │   │   │   └── route.ts
│   │   │   │   └── 📁 rezervasyon/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── 📁 yonetim/
│   │   │   │   └── route.ts       # Kullanıcı yönetimi
│   │   │   │
│   │   │   └── 📁 ziyaret/
│   │   │       ├── route.ts
│   │   │       └── 📁 sg/         # Şehit-Gazi
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Global stiller
│   │   ├── loading.tsx            # Global loading
│   │   ├── error.tsx              # Global error
│   │   └── not-found.tsx          # 404 sayfası
│   │
│   ├── 📁 components/
│   │   │
│   │   ├── 📁 ui/                 # Temel UI bileşenleri
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── dropdown.tsx
│   │   │
│   │   ├── 📁 layout/             # Layout bileşenleri
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   │
│   │   ├── 📁 forms/              # Form bileşenleri
│   │   │   ├── login-form.tsx
│   │   │   ├── arac-form.tsx
│   │   │   ├── personel-form.tsx
│   │   │   ├── randevu-form.tsx
│   │   │   ├── toplanti-form.tsx
│   │   │   ├── muhtar-form.tsx
│   │   │   └── evrak-form.tsx
│   │   │
│   │   ├── 📁 tables/             # Tablo bileşenleri
│   │   │   ├── data-table.tsx     # Genel tablo
│   │   │   ├── arac-table.tsx
│   │   │   ├── personel-table.tsx
│   │   │   ├── randevu-table.tsx
│   │   │   └── evrak-table.tsx
│   │   │
│   │   ├── 📁 modals/             # Modal bileşenleri
│   │   │   ├── confirm-modal.tsx
│   │   │   ├── form-modal.tsx
│   │   │   └── detail-modal.tsx
│   │   │
│   │   └── 📁 dashboard/          # Dashboard bileşenleri
│   │       ├── stat-card.tsx
│   │       ├── activity-feed.tsx
│   │       └── quick-actions.tsx
│   │
│   ├── 📁 lib/                    # Utility fonksiyonlar
│   │   ├── prisma.ts              # Prisma client
│   │   ├── auth.ts                # NextAuth config
│   │   ├── utils.ts               # Helper fonksiyonlar
│   │   └── validations.ts         # Zod schemas
│   │
│   ├── 📁 hooks/                  # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-toast.ts
│   │   ├── use-modal.ts
│   │   └── use-pagination.ts
│   │
│   ├── 📁 stores/                 # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts
│   │   └── filter-store.ts
│   │
│   ├── 📁 types/                  # TypeScript tanımlamaları
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── api.ts
│   │   └── models.ts
│   │
│   ├── 📁 utils/                  # Yardımcı fonksiyonlar
│   │   ├── constants.ts           # Sabitler
│   │   ├── permissions.ts         # Yetki kontrolleri
│   │   └── formatters.ts          # Formatlama
│   │
│   └── middleware.ts              # Route koruması
│
├── .env                           # Environment variables
├── .env.example                   # Örnek env dosyası
├── .eslintrc.json
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 📄 Temel Dosya İçerikleri

### src/app/layout.tsx (Root Layout)

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Valilik Yönetim Sistemi",
  description: "Valilik Yönetim ve Takip Sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### src/app/providers.tsx

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### src/app/(auth)/layout.tsx

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
```

### src/app/(dashboard)/layout.tsx

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="lg:ml-64">
        <Header user={session.user} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### src/middleware.ts

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Yetki kontrolü
    if (path.startsWith("/dashboard/yonetim")) {
      const allowedRoles = ["makam", "okm"];
      if (!token?.role || !allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

## 📁 Routing Yapısı (PHP → Next.js)

| PHP Dosyası | Next.js Route | URL |
|-------------|---------------|-----|
| `index.php` | `app/(auth)/login/page.tsx` | `/login` |
| `menu.php` | `app/(dashboard)/page.tsx` | `/dashboard` |
| `gunluk-program.php` | `app/(dashboard)/gunluk-program/page.tsx` | `/dashboard/gunluk-program` |
| `makam-randevu.php` | `app/(dashboard)/makam-randevu/page.tsx` | `/dashboard/makam-randevu` |
| `toplanti-yonetimi.php` | `app/(dashboard)/toplanti/page.tsx` | `/dashboard/toplanti` |
| `arac-planlama.php` | `app/(dashboard)/arac/page.tsx` | `/dashboard/arac` |
| `envanter.php` | `app/(dashboard)/envanter/page.tsx` | `/dashboard/envanter` |
| `ik-modulu.php` | `app/(dashboard)/ik/page.tsx` | `/dashboard/ik` |
| `yonetim.php` | `app/(dashboard)/yonetim/page.tsx` | `/dashboard/yonetim` |

---

## ➡️ Sonraki Adım

[03-VERITABANI-PRISMA.md](./03-VERITABANI-PRISMA.md) - Prisma ORM ve veritabanı şeması
