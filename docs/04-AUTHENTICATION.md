# 04 - Authentication (Kimlik Doğrulama) Sistemi

## 🔐 Mevcut PHP Auth Yapısı

Mevcut sistemde `auth.php` dosyası şunları yapıyor:
- PHP Session ile oturum yönetimi
- 30 dakika timeout
- CSRF token oluşturma
- Yetki matrisi kontrolü
- Sayfa bazlı erişim kontrolü

---

## 🚀 Next.js Auth Yapısı (NextAuth.js v5)

### Kurulum

```bash
pnpm add next-auth@beta
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

---

## 📁 Auth Dosyaları

### src/lib/auth.ts (Ana Auth Config)

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Yetki matrisi (mevcut PHP'den)
export const yetkiHaritasi: Record<string, string[]> = {
  makam: ["all"],
  okm: ["all"],
  protokol: ["all"],
  idari: [
    "toplanti",
    "vip-ziyaret",
    "envanter",
    "kurum-amirleri",
    "ik",
    "muhtar",
    "evrak",
    "talimat",
    "ziyaretler",
    "konusma-metin",
    "rehber",
  ],
  metin: ["konusma-metin"],
  arac: ["arac"],
  sekreterlik: ["kurum-amirleri", "muhtar", "rehber"],
  destek: ["envanter"],
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Kullanıcı Adı", type: "text" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Kullanıcı adı ve şifre gerekli");
        }

        // Veritabanından kullanıcıyı bul
        const user = await prisma.kullanici.findUnique({
          where: { kadi: credentials.username },
        });

        if (!user) {
          throw new Error("Kullanıcı bulunamadı");
        }

        // Şifre kontrolü
        const isValid = await bcrypt.compare(
          credentials.password,
          user.sifre
        );

        if (!isValid) {
          throw new Error("Şifre hatalı");
        }

        return {
          id: user.id.toString(),
          name: user.kadi.toUpperCase(),
          username: user.kadi,
          role: user.yetki,
          customPermissions: user.ozel_yetkiler,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.customPermissions = user.customPermissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.customPermissions = token.customPermissions as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 dakika (mevcut PHP ile aynı)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

---

### src/types/next-auth.d.ts (Type Tanımlamaları)

```typescript
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      customPermissions: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: string;
    customPermissions: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    role: string;
    customPermissions: string | null;
  }
}
```

---

### src/app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

## 🔒 Middleware (Route Koruması)

### src/middleware.ts

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { yetkiHaritasi } from "@/lib/auth";

// Sayfa-route eşleştirmesi
const routePermissions: Record<string, string> = {
  "/dashboard/gunluk-program": "gunluk-program",
  "/dashboard/makam-randevu": "makam-randevu",
  "/dashboard/toplanti": "toplanti",
  "/dashboard/vip-ziyaret": "vip-ziyaret",
  "/dashboard/protokol-etkinlik": "protokol-etkinlik",
  "/dashboard/resmi-davet": "resmi-davet",
  "/dashboard/arac": "arac",
  "/dashboard/envanter": "envanter",
  "/dashboard/kurum-amirleri": "kurum-amirleri",
  "/dashboard/ik": "ik",
  "/dashboard/muhtar": "muhtar",
  "/dashboard/evrak": "evrak",
  "/dashboard/talimat": "talimat",
  "/dashboard/ziyaretler": "ziyaretler",
  "/dashboard/konusma-metin": "konusma-metin",
  "/dashboard/rehber": "rehber",
  "/dashboard/yonetim": "yonetim",
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Token yoksa login'e yönlendir (withAuth zaten yapıyor ama güvenlik için)
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = token.role as string;
    const userPermissions = yetkiHaritasi[userRole] || [];

    // Yönetim paneli - sadece makam ve okm
    if (path.startsWith("/dashboard/yonetim")) {
      if (!["makam", "okm"].includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Sayfa bazlı yetki kontrolü
    const requiredPermission = routePermissions[path];
    if (requiredPermission) {
      const hasAccess =
        userPermissions.includes("all") ||
        userPermissions.includes(requiredPermission);

      if (!hasAccess) {
        // Yetkisiz erişim - ana sayfaya yönlendir
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
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

## 📄 Login Sayfası

### src/app/(auth)/login/page.tsx

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeout = searchParams.get("timeout");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl mb-4">
          <img src="/vys.png" alt="VYS" className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-white">Valilik Yönetim Sistemi</h1>
      </div>

      {/* Login Card */}
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Hoş Geldiniz</h2>
          <p className="text-slate-500 text-sm mt-1">
            Sisteme giriş yapmak için bilgilerinizi girin
          </p>
        </div>

        {/* Timeout Uyarısı */}
        {timeout && (
          <div className="flex items-center gap-3 bg-amber-50 text-amber-700 p-4 rounded-xl mb-6 border border-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Oturumunuz zaman aşımına uğradı. Lütfen tekrar giriş yapın.</span>
          </div>
        )}

        {/* Hata Mesajı */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              <User className="inline w-4 h-4 text-blue-500 mr-1" />
              Kullanıcı Adı
            </label>
            <input
              {...register("username")}
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              placeholder="Kullanıcı adınızı girin"
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              <Lock className="inline w-4 h-4 text-blue-500 mr-1" />
              Şifre
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            <Lock className="inline w-3 h-3 text-emerald-500 mr-1" />
            256-bit SSL ile güvenli bağlantı
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🛠️ Yetki Kontrol Hook'u

### src/hooks/use-auth.ts

```typescript
"use client";

import { useSession } from "next-auth/react";
import { yetkiHaritasi } from "@/lib/auth";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    
    const permissions = yetkiHaritasi[user.role] || [];
    return permissions.includes("all") || permissions.includes(permission);
  };

  const canDelete = ["makam", "okm"].includes(user?.role || "");
  const canManage = ["makam", "okm"].includes(user?.role || "");

  return {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    canDelete,
    canManage,
  };
}
```

---

## 🔧 API Route'larda Auth Kontrolü

### Örnek: src/app/api/arac/route.ts

```typescript
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Auth kontrolü
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Oturum süresi doldu" },
      { status: 401 }
    );
  }

  const araclar = await prisma.arac.findMany();
  return NextResponse.json(araclar);
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  // Sadece makam ve okm silebilir
  if (!["makam", "okm"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Bu işlem için yetkiniz yok" },
      { status: 403 }
    );
  }

  // ... silme işlemi
}
```

---

## ➡️ Sonraki Adım

[05-API-ROUTES.md](./05-API-ROUTES.md) - API endpoint tasarımı ve implementasyonu
