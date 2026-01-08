import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use the auth export for middleware
export default NextAuth(authConfig).auth;

export const config = {
    // Match only dashboard routes for protection
    // Other routes (login, logout, api, static) are public
    matcher: ["/dashboard/:path*"],
};
