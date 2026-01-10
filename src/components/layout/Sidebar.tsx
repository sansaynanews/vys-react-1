"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarCheck,
  Users,
  Plane,
  Trophy,
  Mail,
  Car,
  Package,
  Building2,
  UserCheck,
  MapPin,
  FileText,
  CheckSquare,
  Heart,
  MessageSquare,
  Phone,
  Settings,
  Shield,
  LayoutDashboard,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

// --- Types ---
interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  permission?: string;
}

interface SidebarProps {
  userRole: string;
  userPermissions: string[];
}

export default function Sidebar({ userRole, userPermissions }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  // State for expand/collapse desktop sidebar
  // 'expanded' means locked open. 'hovering' means temporarily open.
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Show full labels if locked open OR only hovering
  const showLabels = isExpanded || isHovering;

  // Permission Checker
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return userPermissions.includes("all") || userPermissions.includes(permission);
  };

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { id: "gunluk-program", label: "Günlük Program", href: "/dashboard/gunluk-program", icon: Calendar, permission: "gunluk-program" },
    { id: "makam-randevu", label: "Makam Randevu", href: "/dashboard/randevu", icon: CalendarCheck, permission: "makam-randevu" },
    { id: "toplanti", label: "Toplantı Yönetimi", href: "/dashboard/toplanti", icon: Users, permission: "toplanti" },
    { id: "vip", label: "VIP Ziyaret", href: "/dashboard/vip-ziyaret", icon: Plane, permission: "vip-ziyaret" },
    { id: "etkinlik", label: "Protokol Etkinlik", href: "/dashboard/etkinlik", icon: Trophy, permission: "protokol-etkinlik" },
    { id: "protokol", label: "Protokol Listesi", href: "/dashboard/protokol", icon: Users, permission: "protokol" },
    { id: "davet", label: "Resmi Davet", href: "/dashboard/resmi-davetler", icon: Mail, permission: "resmi-davet" },
    { id: "arac", label: "Araç Planlama", href: "/dashboard/arac", icon: Car, permission: "arac" },
    { id: "projeler", label: "Projeler", href: "/dashboard/projeler", icon: CheckSquare, permission: "projeler" },
    { id: "envanter", label: "Envanter", href: "/dashboard/envanter", icon: Package, permission: "envanter" },
    { id: "kurum", label: "Kurum Amirleri", href: "/dashboard/kurum-amirleri", icon: Building2, permission: "kurum-amirleri" },
    { id: "ik", label: "İnsan Kaynakları", href: "/dashboard/ik", icon: UserCheck, permission: "ik" },
    { id: "muhtar", label: "Muhtar Bilgi", href: "/dashboard/muhtar", icon: MapPin, permission: "muhtar" },
    { id: "evrak", label: "Evrak Takip", href: "/dashboard/evrak", icon: FileText, permission: "evrak" },
    { id: "talimat", label: "Talimat Takip", href: "/dashboard/talimatlar", icon: CheckSquare, permission: "talimat" },
    { id: "ziyaretler", label: "Ziyaretler", href: "/dashboard/ziyaretler", icon: Heart, permission: "ziyaretler" },
    { id: "konusma", label: "Konuşma Metni", href: "/dashboard/konusma-metinleri", icon: MessageSquare, permission: "konusma-metin" },
    { id: "rehber", label: "Telefon Rehberi", href: "/dashboard/rehber", icon: Phone, permission: "rehber" },
  ];

  if (["makam", "okm"].includes(userRole)) {
    menuItems.push({
      id: "yonetim",
      label: "Yönetim",
      href: "/dashboard/yonetim",
      icon: Settings,
      permission: "yonetim"
    });
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* --- Main Sidebar Container --- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-gradient-to-b from-white to-slate-100 shadow-xl transition-all duration-300 ease-in-out border-r border-slate-200/60",
          // Width control
          (showLabels && !isOpen) ? "w-64" : "w-20",
          // Mobile visibility
          isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        onMouseEnter={() => !isExpanded && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >

        {/* Logo & Toggle Area */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm shrink-0">
          <div className={cn("flex items-center gap-3 transition-all duration-300", !showLabels && "justify-center w-full")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-slate-800 shadow-lg shadow-blue-900/20">
              <Shield className="h-6 w-6 text-white" />
            </div>

            {showLabels && (
              <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="font-bold text-slate-800 whitespace-nowrap">Valilik YS</span>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">Yönetim Paneli</span>
              </div>
            )}
          </div>

          {/* Pin Button */}
          {showLabels && (
            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                setIsHovering(false);
              }}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isExpanded ? "Menüyü Daralt" : "Menüyü Sabitle"}
            >
              {isExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {menuItems.map((item) => {
            if (!hasPermission(item.permission)) return null;

            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) close();
                }}
                className={cn(
                  "group relative flex items-center rounded-xl transition-all duration-200 overflow-hidden whitespace-nowrap",
                  // Height/Layout adjustment
                  showLabels ? "h-11 px-3 w-full justify-start gap-3" : "h-12 w-12 justify-center mx-auto",

                  isActive
                    ? "bg-gradient-to-r from-blue-900 to-slate-800 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:ring-1 hover:ring-slate-200"
                )}
              >
                <Icon className={cn("shrink-0 transition-all", showLabels ? "h-5 w-5" : "h-6 w-6")} />

                {showLabels && (
                  <span className="text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.label}
                  </span>
                )}

                {/* Tooltip for Collapsed State */}
                {!showLabels && (
                  <div className="absolute left-14 z-50 hidden rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-xl whitespace-nowrap group-hover:block pointer-events-none">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200/60 p-4 shrink-0 bg-white/50 backdrop-blur-sm">
          <div className={cn("flex items-center", showLabels ? "gap-3" : "justify-center")}>
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
              <User className="h-5 w-5" />
            </div>

            {showLabels && (
              <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2">
                <div className="text-sm font-bold text-slate-700 truncate">Kullanıcı</div>
                <div className="text-xs text-slate-500 truncate capitalize">{userRole}</div>
              </div>
            )}

            {showLabels && (
              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
