import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

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

export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Kullanıcı Adı", type: "text" },
                password: { label: "Şifre", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Kullanıcı adı ve şifre gerekli");
                }

                // API'ye istek at (Edge Runtime uyumlu)
                const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: credentials.username,
                        password: credentials.password,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Kimlik doğrulama başarısız");
                }

                const user = await response.json();
                return user;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.username = (user as any).username;
                token.role = (user as any).role;
                token.customPermissions = (user as any).customPermissions;
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
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const path = nextUrl.pathname;

            // Public rotalar
            if (path === "/login" || path === "/logout") {
                if (isLoggedIn && path === "/login") {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            // Dashboard rotaları için auth kontrolü
            if (path.startsWith("/dashboard")) {
                return isLoggedIn;
            }

            // Root'a gelince yönlendir
            if (path === "/") {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return Response.redirect(new URL("/login", nextUrl));
            }

            return true;
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
