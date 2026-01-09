"use client";

import { SidebarProvider } from "@/contexts/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    userName: string;
    userRole: string;
    userPermissions: string[];
}

export default function DashboardLayoutClient({
    children,
    userName,
    userRole,
    userPermissions,
}: DashboardLayoutClientProps) {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-slate-50">
                {/* Sidebar */}
                <Sidebar userRole={userRole} userPermissions={userPermissions} />

                {/* Main Content Area - Responsive margin */}
                <div className="lg:ml-64">
                    {/* Header */}
                    <Header userName={userName} userRole={userRole} />

                    {/* Page Content */}
                    <main className="pt-16 min-h-screen">
                        <div className="p-4 lg:p-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
