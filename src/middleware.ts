export { auth as middleware } from "@/lib/auth";

export const config = {
    matcher: [
        "/",
        "/login",
        "/logout",
        "/dashboard/:path*",
    ],
};
