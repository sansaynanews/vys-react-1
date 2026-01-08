"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  href?: string;
  icon: any;
  permission?: string;
  children?: MenuItem[];
  color?: string;
}

interface SidebarProps {
  userRole: string;
  userPermissions: string[];
}

export default function Sidebar({ userRole, userPermissions }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["makam", "organizasyon", "idari", "belge"]);

  const menuItems: { [key: string]: MenuItem[] } = {
    dashboard: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        color: "text-blue-500"
      }
    ],
    makam: [
      {
        label: "Günlük Program",
        href: "/dashboard/gunluk-program",
        icon: Calendar,
        permission: "gunluk-program",
        color: "text-blue-500"
      },
      {
        label: "Makam Randevu",
        href: "/dashboard/randevu",
        icon: CalendarCheck,
        permission: "makam-randevu",
        color: "text-blue-500"
      }
    ],
    organizasyon: [
      {
        label: "Toplantı Yönetimi",
        href: "/dashboard/toplanti",
        icon: Users,
        permission: "toplanti",
        color: "text-cyan-500"
      },
      {
        label: "VIP Ziyaret",
        href: "/dashboard/vip-ziyaret",
        icon: Plane,
        permission: "vip-ziyaret",
        color: "text-cyan-500"
      },
      {
        label: "Protokol Etkinlik",
        href: "/dashboard/protokol-etkinlik",
        icon: Trophy,
        permission: "protokol-etkinlik",
        color: "text-cyan-500"
      },
      {
        label: "Resmi Davet",
        href: "/dashboard/resmi-davet",
        icon: Mail,
        permission: "resmi-davet",
        color: "text-cyan-500"
      }
    ],
    idari: [
      {
        label: "Araç Planlama",
        href: "/dashboard/arac",
        icon: Car,
        permission: "arac",
        color: "text-emerald-500"
      },
      {
        label: "Envanter",
        href: "/dashboard/envanter",
        icon: Package,
        permission: "envanter",
        color: "text-emerald-500"
      },
      {
        label: "Kurum Amirleri",
        href: "/dashboard/kurum-amirleri",
        icon: Building2,
        permission: "kurum-amirleri",
        color: "text-emerald-500"
      },
      {
        label: "İnsan Kaynakları",
        href: "/dashboard/ik",
        icon: UserCheck,
        permission: "ik",
        color: "text-emerald-500"
      },
      {
        label: "Muhtar Bilgi",
        href: "/dashboard/muhtar",
        icon: MapPin,
        permission: "muhtar",
        color: "text-emerald-500"
      }
    ],
    belge: [
      {
        label: "Evrak Takip",
        href: "/dashboard/evrak",
        icon: FileText,
        permission: "evrak",
        color: "text-purple-500"
      },
      {
        label: "Talimat Takip",
        href: "/dashboard/talimat",
        icon: CheckSquare,
        permission: "talimat",
        color: "text-purple-500"
      },
      {
        label: "Ziyaretler",
        href: "/dashboard/ziyaretler",
        icon: Heart,
        permission: "ziyaretler",
        color: "text-purple-500"
      },
      {
        label: "Konuşma Metni",
        href: "/dashboard/konusma-metin",
        icon: MessageSquare,
        permission: "konusma-metin",
        color: "text-purple-500"
      },
      {
        label: "Telefon Rehberi",
        href: "/dashboard/rehber",
        icon: Phone,
        permission: "rehber",
        color: "text-purple-500"
      }
    ]
  };

  // Yönetim menüsü - sadece makam ve okm
  if (["makam", "okm"].includes(userRole)) {
    menuItems.yonetim = [
      {
        label: "Kullanıcı Yönetimi",
        href: "/dashboard/yonetim",
        icon: Settings,
        permission: "yonetim",
        color: "text-amber-500"
      }
    ];
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return userPermissions.includes("all") || userPermissions.includes(permission);
  };

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuKey)
        ? prev.filter(k => k !== menuKey)
        : [...prev, menuKey]
    );
  };

  const categoryTitles: { [key: string]: string } = {
    dashboard: "Ana Sayfa",
    makam: "MAKAM",
    organizasyon: "ORGANİZASYON",
    idari: "İDARİ İŞLEMLER",
    belge: "BELGE & TAKİP",
    yonetim: "YÖNETİM"
  };

  return (
    <aside className="w-64 bg-slate-800 text-white min-h-screen fixed left-0 top-0 overflow-y-auto shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Valilik YS</h1>
            <p className="text-xs text-slate-400">v2.0 - React</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {Object.entries(menuItems).map(([key, items]) => {
          const isExpanded = expandedMenus.includes(key);
          const hasAnyPermission = items.some(item => hasPermission(item.permission));

          if (!hasAnyPermission) return null;

          return (
            <div key={key}>
              {key !== "dashboard" && (
                <button
                  onClick={() => toggleMenu(key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition uppercase tracking-wider"
                >
                  <span>{categoryTitles[key]}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}

              {(key === "dashboard" || isExpanded) && (
                <div className="space-y-1">
                  {items.map((item) => {
                    if (!hasPermission(item.permission)) return null;

                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href!}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition",
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", isActive ? "text-white" : item.color)} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-900">
        <div className="text-xs text-slate-400 text-center">
          <p className="font-semibold text-slate-300">{userRole.toUpperCase()}</p>
          <p className="mt-1">© 2026 Valilik YS</p>
        </div>
      </div>
    </aside>
  );
}
