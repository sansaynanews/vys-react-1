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
