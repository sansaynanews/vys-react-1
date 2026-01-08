"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      await signOut({ redirect: false });
      router.push("/login");
    };

    handleLogout();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <LogOut className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-white">Çıkış Yapılıyor...</h2>
      <p className="text-blue-200">Güvenli bir şekilde oturumunuz sonlandırılıyor.</p>
    </div>
  );
}
