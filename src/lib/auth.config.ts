import type { NextAuthConfig } from "next-auth";

// Yetki matrisi (mevcut PHP'den)
export const yetkiHaritasi: Record<string, string[]> = {
    admin: ["all"],
    ozel_kalem: ["all"],
    kullanici: [],
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
        "projeler",
    ],
    metin: ["konusma-metin"],
    arac: ["arac"],
    sekreterlik: ["kurum-amirleri", "muhtar", "rehber"],
    destek: ["envanter"],
};

export const authConfig = {
    trustHost: true,
    secret: process.env.AUTH_SECRET || "complex_fallback_secret_for_dev_only",
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 60,
    },
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

            // Only protect dashboard routes
            if (path.startsWith("/dashboard")) {
                if (!isLoggedIn) {
                    // Redirect to login if not authenticated
                    return Response.redirect(new URL("/login", nextUrl));
                }
            }

            // Allow all other requests
            return true;
        },
    },
    providers: [], // Providers are configured in auth.ts
} satisfies NextAuthConfig;
