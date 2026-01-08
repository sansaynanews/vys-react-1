import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { yetkiHaritasi } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role as string;
  const userPermissions = yetkiHaritasi[userRole] || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar userRole={userRole} userPermissions={userPermissions} />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header */}
        <Header
          userName={session.user.name || session.user.username || "Kullanıcı"}
          userRole={userRole}
        />

        {/* Page Content */}
        <main className="pt-16 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
