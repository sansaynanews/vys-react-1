import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
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

                try {
                    console.log("Auth attempt for:", credentials.username);

                    // Node.js specific imports (Safe here because this file is not used in middleware)
                    const { default: pool } = await import("./db");
                    const bcrypt = (await import("bcryptjs")).default;
                    const crypto = await import("crypto");

                    // 1. Find user
                    const [rows] = await pool.execute(
                        'SELECT * FROM kullanicilar WHERE kadi = ? LIMIT 1',
                        [credentials.username]
                    );

                    const users = rows as any[];
                    if (!users || users.length === 0) {
                        throw new Error("Kullanıcı bulunamadı");
                    }

                    const user = users[0];
                    let isValid = false;

                    // 2. Password Check (MD5 Legacy fallback + bcrypt)
                    const md5Hash = crypto.createHash("md5").update(credentials.password as string).digest("hex");

                    if (user.sifre === md5Hash) {
                        isValid = true;
                    } else {
                        try {
                            // Compare with bcrypt
                            isValid = await bcrypt.compare(credentials.password as string, user.sifre);
                        } catch (e) {
                            isValid = false;
                        }
                    }

                    if (!isValid) {
                        throw new Error("Şifre hatalı");
                    }

                    // 3. Return user object
                    return {
                        id: user.id.toString(),
                        name: user.kadi.toLocaleUpperCase('tr-TR'),
                        username: user.kadi,
                        role: user.yetki,
                        customPermissions: user.ozel_yetkiler,
                    };

                } catch (error: any) {
                    console.error("Authorize error:", error.message);
                    throw new Error(error.message || "Giriş başarısız");
                }
            },
        }),
    ],
});
