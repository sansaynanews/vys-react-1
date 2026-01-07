# 06 - Sayfalar ve Komponentler

## 🎨 Temel UI Komponentleri

### src/components/ui/button.tsx

```tsx
import { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
        ghost: "text-slate-600 hover:bg-slate-100 focus:ring-slate-500",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

### src/components/ui/input.tsx

```tsx
import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border border-slate-300",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
            "outline-none transition text-slate-700",
            "placeholder:text-slate-400",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
```

### src/components/ui/modal.tsx

```tsx
"use client";

import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full",
          "max-h-[90vh] overflow-hidden flex flex-col",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
```

### src/components/ui/toast.tsx

```tsx
"use client";

import { create } from "zustand";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Helper function
export const toast = {
  success: (message: string) => useToastStore.getState().addToast(message, "success"),
  error: (message: string) => useToastStore.getState().addToast(message, "error"),
  info: (message: string) => useToastStore.getState().addToast(message, "info"),
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
};

const colors = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  error: "bg-red-50 text-red-800 border-red-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg",
              "animate-in slide-in-from-right duration-300",
              colors[t.type]
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 p-1 hover:bg-black/5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🏗️ Layout Komponentleri

### src/components/layout/sidebar.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  UserShield,
  Flag,
  Mail,
  Car,
  Package,
  Building2,
  UserCog,
  MapPin,
  FileText,
  Megaphone,
  Medal,
  Mic,
  Phone,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const menuSections = [
  {
    title: "Makam",
    color: "blue",
    items: [
      { name: "Günlük Program", href: "/dashboard/gunluk-program", icon: Calendar, permission: "gunluk-program" },
      { name: "Makam Randevu", href: "/dashboard/makam-randevu", icon: CalendarCheck, permission: "makam-randevu" },
    ],
  },
  {
    title: "Organizasyon",
    color: "cyan",
    items: [
      { name: "Toplantı Yönetimi", href: "/dashboard/toplanti", icon: Users, permission: "toplanti" },
      { name: "VIP / Protokol Ziyaret", href: "/dashboard/vip-ziyaret", icon: UserShield, permission: "vip-ziyaret" },
      { name: "Protokol ve Resmi Tören", href: "/dashboard/protokol-etkinlik", icon: Flag, permission: "protokol-etkinlik" },
      { name: "Resmi Davet ve Kabul", href: "/dashboard/resmi-davet", icon: Mail, permission: "resmi-davet" },
    ],
  },
  {
    title: "İdari İşlemler",
    color: "blue",
    items: [
      { name: "Taşıt Yönetimi", href: "/dashboard/arac", icon: Car, permission: "arac" },
      { name: "Stok Takip Yönetimi", href: "/dashboard/envanter", icon: Package, permission: "envanter" },
      { name: "Kurum Amirleri", href: "/dashboard/kurum-amirleri", icon: Building2, permission: "kurum-amirleri" },
      { name: "İnsan Kaynakları", href: "/dashboard/ik", icon: UserCog, permission: "ik" },
      { name: "Muhtar Bilgi Sistemi", href: "/dashboard/muhtar", icon: MapPin, permission: "muhtar" },
    ],
  },
  {
    title: "Belge & Takip",
    color: "cyan",
    items: [
      { name: "Evrak Takip", href: "/dashboard/evrak", icon: FileText, permission: "evrak" },
      { name: "Talimat Takip", href: "/dashboard/talimat", icon: Megaphone, permission: "talimat" },
      { name: "Şehit ve Gazi", href: "/dashboard/ziyaretler", icon: Medal, permission: "ziyaretler" },
      { name: "Resmi Metin Yönetimi", href: "/dashboard/konusma-metin", icon: Mic, permission: "konusma-metin" },
      { name: "Telefon Rehberi", href: "/dashboard/rehber", icon: Phone, permission: "rehber" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, canManage } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white z-40 hidden lg:block">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-700">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <img src="/vys.png" alt="VYS" className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm">Valilik Yönetim</h1>
          <p className="text-xs text-slate-400">Sistemi</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Dashboard */}
        <div className="px-3 mb-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition",
              pathname === "/dashboard"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Ana Sayfa</span>
          </Link>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="mb-4">
            <h3 className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="px-3 space-y-1">
              {section.items
                .filter((item) => hasPermission(item.permission))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm",
                        isActive
                          ? "bg-slate-700 text-white"
                          : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Yönetim (Admin Only) */}
        {canManage && (
          <div className="mb-4">
            <h3 className="px-4 mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Yönetim
            </h3>
            <div className="px-3">
              <Link
                href="/dashboard/yonetim"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm",
                  pathname === "/dashboard/yonetim"
                    ? "bg-amber-600 text-white"
                    : "text-amber-400 hover:bg-amber-600/20"
                )}
              >
                <Settings className="w-4 h-4" />
                <span>Kullanıcı Yönetimi</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
```

### src/components/layout/header.tsx

```tsx
"use client";

import { User } from "next-auth";
import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Search (Desktop) */}
      <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Ara..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
            {user.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

## 📄 Örnek Sayfa: Araç Yönetimi

### src/app/(dashboard)/arac/page.tsx

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Car, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { AracForm } from "@/components/forms/arac-form";
import dayjs from "dayjs";

interface Arac {
  id: number;
  plaka: string;
  marka: string;
  model: string | null;
  kurum: string | null;
  sofor: string | null;
  telefon: string | null;
  km: number | null;
  muayene_bit: string | null;
  sigorta_bit: string | null;
}

export default function AracPage() {
  const { canDelete } = useAuth();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArac, setSelectedArac] = useState<Arac | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ["araclar", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
      });
      const res = await fetch(`/api/arac?${params}`);
      if (!res.ok) throw new Error("Veri çekilemedi");
      return res.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/arac/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Araç silindi");
      queryClient.invalidateQueries({ queryKey: ["araclar"] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Silme işlemi başarısız");
    },
  });

  const handleEdit = (arac: Arac) => {
    setSelectedArac(arac);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedArac(null);
    setIsModalOpen(true);
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return dayjs(date).isBefore(dayjs(), "day");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Car className="w-7 h-7 text-blue-600" />
            Taşıt Yönetimi
          </h1>
          <p className="text-slate-500 mt-1">Araç kayıtlarını yönetin</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Araç Ekle
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Plaka, marka, kurum ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Plaka</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Marka/Model</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Kurum</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Şoför</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Muayene</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Sigorta</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Yükleniyor...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                data?.data?.map((arac: Arac) => (
                  <tr key={arac.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{arac.plaka}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {arac.marka} {arac.model}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{arac.kurum || "-"}</td>
                    <td className="py-3 px-4 text-slate-600">{arac.sofor || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      {arac.muayene_bit ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isExpired(arac.muayene_bit)
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isExpired(arac.muayene_bit) && <AlertTriangle className="w-3 h-3" />}
                          {dayjs(arac.muayene_bit).format("DD.MM.YYYY")}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {arac.sigorta_bit ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isExpired(arac.sigorta_bit)
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isExpired(arac.sigorta_bit) && <AlertTriangle className="w-3 h-3" />}
                          {dayjs(arac.sigorta_bit).format("DD.MM.YYYY")}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(arac)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(arac.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <span className="text-sm text-slate-600">
              Toplam {data.pagination.total} kayıt
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Önceki
              </Button>
              <span className="text-sm text-slate-600">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedArac ? "Araç Düzenle" : "Yeni Araç Ekle"}
        size="lg"
      >
        <AracForm
          arac={selectedArac}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["araclar"] });
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Silme Onayı"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteId(null)}
            >
              Vazgeç
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

---

## ➡️ Sonraki Adım

[07-MEVCUT-MODUL-LISTESI.md](./07-MEVCUT-MODUL-LISTESI.md) - Mevcut PHP modüllerinin tam listesi ve eşleştirmesi
