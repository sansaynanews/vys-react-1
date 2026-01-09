import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { yetkiHaritasi } from "@/lib/auth.config";
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";

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
    <DashboardLayoutClient
      userName={session.user.name || session.user.username || "Kullanıcı"}
      userRole={userRole}
      userPermissions={userPermissions}
    >
      {children}
    </DashboardLayoutClient>
  );
}
