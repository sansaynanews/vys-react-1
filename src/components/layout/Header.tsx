"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Bell,
  Search,
  Menu,
  X,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

interface HeaderProps {
  userName: string;
  userRole: string;
}

export default function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter();
  const { toggle, isOpen } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Saat güncelleme
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  });

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const roleLabels: { [key: string]: string } = {
    makam: "Makam",
    okm: "OKM",
    protokol: "Protokol",
    idari: "İdari Koordinatör",
    metin: "Konuşma Metni",
    arac: "Araç Planlama",
    sekreterlik: "Sekreterlik",
    destek: "Destek"
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long"
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-0 lg:left-64 z-40 shadow-sm">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Sol Taraf - Hamburger + Arama */}
        <div className="flex items-center gap-3 flex-1">
          {/* Hamburger Menu Button - Mobile Only */}
          <button
            onClick={toggle}
            className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Menüyü aç"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>

          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ara..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Sağ Taraf - Saat, Bildirimler, Kullanıcı */}
        <div className="flex items-center gap-4">
          {/* Saat ve Tarih */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
            <Clock className="w-4 h-4 text-slate-500" />
            <div className="text-sm">
              <div className="font-semibold text-slate-700">{formatTime(currentTime)}</div>
              <div className="text-xs text-slate-500">{formatDate(currentTime)}</div>
            </div>
          </div>

          {/* Bildirimler */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Bildirimler</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-500 text-center py-8">
                      Henüz bildirim yok
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Kullanıcı Menüsü */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 rounded-lg transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-slate-700">{userName}</div>
                <div className="text-xs text-slate-500">{roleLabels[userRole] || userRole}</div>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-200">
                    <div className="font-semibold text-slate-800">{userName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {roleLabels[userRole] || userRole}
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
