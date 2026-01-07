# 08 - State Management (Zustand & React Query)

Bu dokümanda, Next.js projesinde state yönetimi için kullanılacak Zustand ve TanStack React Query kütüphanelerinin kurulumu ve kullanımı detaylı şekilde açıklanmaktadır.

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Zustand Kurulumu ve Yapılandırması](#2-zustand-kurulumu-ve-yapılandırması)
3. [React Query Kurulumu](#3-react-query-kurulumu)
4. [Store Tanımlamaları](#4-store-tanımlamaları)
5. [Custom Hooks](#5-custom-hooks)
6. [Sayfa Bazlı Kullanım Örnekleri](#6-sayfa-bazlı-kullanım-örnekleri)
7. [Best Practices](#7-best-practices)

---

## 1. Genel Bakış

### State Türleri ve Kullanım Alanları

| State Türü | Kütüphane | Kullanım Alanı |
|------------|-----------|----------------|
| **UI State** | Zustand | Modal açık/kapalı, sidebar durumu, tema, toast mesajları |
| **Server State** | React Query | API'den gelen veriler (araçlar, personel, randevular vb.) |
| **Form State** | React Hook Form | Form verileri, validasyon |
| **Auth State** | NextAuth.js | Kullanıcı oturumu, yetkilendirme |

### Neden Bu Kombinasyon?

- **Zustand**: Minimal, hızlı, TypeScript dostu, boilerplate yok
- **React Query**: Otomatik caching, background refetch, optimistic updates
- **Birlikte**: Server ve client state'i temiz şekilde ayrıştırır

---

## 2. Zustand Kurulumu ve Yapılandırması

### Kurulum

```bash
npm install zustand
```

### Store Klasör Yapısı

```
src/
├── stores/
│   ├── index.ts              # Tüm store'ları export
│   ├── useUIStore.ts         # UI state (modal, sidebar, tema)
│   ├── useToastStore.ts      # Toast bildirimleri
│   ├── useFilterStore.ts     # Tablo filtreleri
│   └── useSearchStore.ts     # Global arama
```

---

## 3. React Query Kurulumu

### Kurulum

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Provider Yapılandırması

**src/providers/QueryProvider.tsx**
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 dakika
            gcTime: 5 * 60 * 1000, // 5 dakika (eski cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**src/app/layout.tsx (Güncelleme)**
```tsx
import QueryProvider from '@/providers/QueryProvider';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <SessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## 4. Store Tanımlamaları

### 4.1 UI Store

**src/stores/useUIStore.ts**
```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modal
  activeModal: string | null;
  modalData: any;
  
  // Tema
  theme: 'light' | 'dark';
  
  // Actions
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      theme: 'light',

      // Actions
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      collapseSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      openModal: (modalId, data = null) => set({ 
        activeModal: modalId, 
        modalData: data 
      }),
      
      closeModal: () => set({ 
        activeModal: null, 
        modalData: null 
      }),
      
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage', // localStorage key
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed 
      }),
    }
  )
);
```

### 4.2 Toast Store

**src/stores/useToastStore.ts**
```tsx
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  
  addToast: (type, message, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
    
    // Otomatik kaldırma
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  
  clearAll: () => set({ toasts: [] }),
}));

// Yardımcı fonksiyonlar
export const toast = {
  success: (message: string) => useToastStore.getState().addToast('success', message),
  error: (message: string) => useToastStore.getState().addToast('error', message),
  warning: (message: string) => useToastStore.getState().addToast('warning', message),
  info: (message: string) => useToastStore.getState().addToast('info', message),
};
```

### 4.3 Filter Store

**src/stores/useFilterStore.ts**
```tsx
import { create } from 'zustand';

interface FilterState {
  // Genel filtreler
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Tarih aralığı
  dateFrom: string | null;
  dateTo: string | null;
  
  // Modül bazlı filtreler
  aracFilters: {
    durum: string;
    tip: string;
  };
  
  personelFilters: {
    birim: string;
    durum: string;
  };
  
  randevuFilters: {
    durum: string;
    tip: string;
  };
  
  // Actions
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setAracFilter: (key: keyof FilterState['aracFilters'], value: string) => void;
  setPersonelFilter: (key: keyof FilterState['personelFilters'], value: string) => void;
  setRandevuFilter: (key: keyof FilterState['randevuFilters'], value: string) => void;
  resetFilters: () => void;
}

const initialState = {
  search: '',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
  dateFrom: null,
  dateTo: null,
  aracFilters: { durum: '', tip: '' },
  personelFilters: { birim: '', durum: '' },
  randevuFilters: { durum: '', tip: '' },
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo, page: 1 }),
  
  setAracFilter: (key, value) => set((state) => ({
    aracFilters: { ...state.aracFilters, [key]: value },
    page: 1,
  })),
  
  setPersonelFilter: (key, value) => set((state) => ({
    personelFilters: { ...state.personelFilters, [key]: value },
    page: 1,
  })),
  
  setRandevuFilter: (key, value) => set((state) => ({
    randevuFilters: { ...state.randevuFilters, [key]: value },
    page: 1,
  })),
  
  resetFilters: () => set(initialState),
}));
```

### 4.4 Store Index

**src/stores/index.ts**
```tsx
export { useUIStore } from './useUIStore';
export { useToastStore, toast } from './useToastStore';
export { useFilterStore } from './useFilterStore';
```

---

## 5. Custom Hooks

### 5.1 API Hooks Yapısı

```
src/
├── hooks/
│   ├── api/
│   │   ├── useAraclar.ts
│   │   ├── usePersoneller.ts
│   │   ├── useRandevular.ts
│   │   ├── useToplantilar.ts
│   │   ├── useMuhtarlar.ts
│   │   ├── useEvraklar.ts
│   │   ├── useEnvanter.ts
│   │   ├── useKurumAmirleri.ts
│   │   └── useDashboard.ts
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   └── index.ts
```

### 5.2 Araç Hook'u (Örnek)

**src/hooks/api/useAraclar.ts**
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFilterStore } from '@/stores';
import { toast } from '@/stores/useToastStore';
import type { Arac } from '@prisma/client';

// Types
interface AracListResponse {
  data: Arac[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AracInput {
  plaka: string;
  marka: string;
  model: string;
  yil: number;
  arac_tipi: string;
  durum: string;
  muayene_tarihi?: string;
  sigorta_tarihi?: string;
  aciklama?: string;
}

// API fonksiyonları
const aracApi = {
  getAll: async (params: Record<string, any>): Promise<AracListResponse> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
    
    const res = await fetch(`/api/arac?${searchParams}`);
    if (!res.ok) throw new Error('Araçlar yüklenemedi');
    return res.json();
  },
  
  getById: async (id: number): Promise<Arac> => {
    const res = await fetch(`/api/arac/${id}`);
    if (!res.ok) throw new Error('Araç bulunamadı');
    return res.json();
  },
  
  create: async (data: AracInput): Promise<Arac> => {
    const res = await fetch('/api/arac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Araç eklenemedi');
    }
    return res.json();
  },
  
  update: async ({ id, data }: { id: number; data: Partial<AracInput> }): Promise<Arac> => {
    const res = await fetch(`/api/arac/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Araç güncellenemedi');
    }
    return res.json();
  },
  
  delete: async (id: number): Promise<void> => {
    const res = await fetch(`/api/arac/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Araç silinemedi');
  },
};

// Hooks
export function useAraclar() {
  const { search, page, limit, aracFilters } = useFilterStore();
  
  return useQuery({
    queryKey: ['araclar', { search, page, limit, ...aracFilters }],
    queryFn: () => aracApi.getAll({ 
      search, 
      page, 
      limit,
      durum: aracFilters.durum,
      tip: aracFilters.tip,
    }),
  });
}

export function useArac(id: number) {
  return useQuery({
    queryKey: ['arac', id],
    queryFn: () => aracApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateArac() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: aracApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['araclar'] });
      toast.success('Araç başarıyla eklendi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateArac() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: aracApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['araclar'] });
      queryClient.setQueryData(['arac', data.id], data);
      toast.success('Araç başarıyla güncellendi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteArac() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: aracApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['araclar'] });
      toast.success('Araç başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
```

### 5.3 Dashboard Hook'u

**src/hooks/api/useDashboard.ts**
```tsx
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface DashboardData {
  bugun: {
    randevular: any[];
    toplantilar: any[];
    aracGorevleri: any[];
    izinler: any[];
  };
  yarin: {
    randevular: any[];
    toplantilar: any[];
  };
  istatistikler: {
    bekleyenRandevu: number;
    aktifPersonel: number;
    mevcutArac: number;
    bekleyenEvrak: number;
  };
}

export function useDashboard() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['dashboard', session?.user?.rol],
    queryFn: async (): Promise<DashboardData> => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Dashboard verileri yüklenemedi');
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // 5 dakikada bir yenile
    enabled: !!session,
  });
}
```

### 5.4 Utility Hooks

**src/hooks/useDebounce.ts**
```tsx
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**src/hooks/useMediaQuery.ts**
```tsx
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Hazır breakpoint hook'ları
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
```

### 5.5 Hooks Index

**src/hooks/index.ts**
```tsx
// API Hooks
export * from './api/useAraclar';
export * from './api/usePersoneller';
export * from './api/useRandevular';
export * from './api/useDashboard';

// Utility Hooks
export { useDebounce } from './useDebounce';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';
```

---

## 6. Sayfa Bazlı Kullanım Örnekleri

### 6.1 Araç Listesi Sayfası

**src/app/(dashboard)/arac/page.tsx**
```tsx
'use client';

import { useState } from 'react';
import { useAraclar, useDeleteArac } from '@/hooks';
import { useFilterStore, useUIStore } from '@/stores';
import { useDebounce } from '@/hooks';
import { Button, Input, Modal } from '@/components/ui';
import { DataTable } from '@/components/DataTable';
import { AracForm } from '@/components/forms/AracForm';
import { Plus, Search, Filter } from 'lucide-react';

export default function AracPage() {
  // Stores
  const { search, setSearch, page, setPage, aracFilters, setAracFilter } = useFilterStore();
  const { openModal, closeModal, activeModal, modalData } = useUIStore();
  
  // Debounced search
  const debouncedSearch = useDebounce(search, 300);
  
  // API Hooks
  const { data, isLoading, error } = useAraclar();
  const deleteMutation = useDeleteArac();
  
  // Handlers
  const handleAdd = () => openModal('arac-form');
  const handleEdit = (arac: any) => openModal('arac-form', arac);
  const handleDelete = (id: number) => openModal('delete-confirm', { id });
  
  const confirmDelete = () => {
    if (modalData?.id) {
      deleteMutation.mutate(modalData.id);
      closeModal();
    }
  };

  // Columns
  const columns = [
    { key: 'plaka', label: 'Plaka', sortable: true },
    { key: 'marka', label: 'Marka' },
    { key: 'model', label: 'Model' },
    { key: 'arac_tipi', label: 'Tip' },
    { 
      key: 'durum', 
      label: 'Durum',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 'aktif' ? 'bg-green-100 text-green-800' :
          value === 'bakim' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            Düzenle
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-red-600"
            onClick={() => handleDelete(row.id)}
          >
            Sil
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Araç Yönetimi</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Araç
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Plaka veya marka ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={aracFilters.durum}
          onChange={(e) => setAracFilter('durum', e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="bakim">Bakımda</option>
          <option value="pasif">Pasif</option>
        </select>
        
        <select
          value={aracFilters.tip}
          onChange={(e) => setAracFilter('tip', e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Tüm Tipler</option>
          <option value="binek">Binek</option>
          <option value="minibus">Minibüs</option>
          <option value="otobus">Otobüs</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination.totalPages || 1,
          onPageChange: setPage,
        }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={activeModal === 'arac-form'}
        onClose={closeModal}
        title={modalData ? 'Araç Düzenle' : 'Yeni Araç'}
      >
        <AracForm
          initialData={modalData}
          onSuccess={closeModal}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={activeModal === 'delete-confirm'}
        onClose={closeModal}
        title="Silme Onayı"
        size="sm"
      >
        <p className="mb-4">Bu aracı silmek istediğinizden emin misiniz?</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={closeModal}>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            loading={deleteMutation.isPending}
          >
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```

### 6.2 Dashboard Sayfası

**src/app/(dashboard)/page.tsx**
```tsx
'use client';

import { useDashboard } from '@/hooks';
import { useSession } from 'next-auth/react';
import { 
  Calendar, Users, Car, FileText, 
  Clock, AlertTriangle 
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Hoş Geldiniz, {session?.user?.ad_soyad}
      </h1>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Bekleyen Randevu"
          value={data?.istatistikler.bekleyenRandevu || 0}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Aktif Personel"
          value={data?.istatistikler.aktifPersonel || 0}
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Mevcut Araç"
          value={data?.istatistikler.mevcutArac || 0}
          icon={<Car className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Bekleyen Evrak"
          value={data?.istatistikler.bekleyenEvrak || 0}
          icon={<FileText className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Bugün / Yarın */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bugünkü Etkinlikler */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Bugün
          </h2>
          
          {data?.bugun.randevular.length === 0 && 
           data?.bugun.toplantilar.length === 0 ? (
            <p className="text-gray-500">Bugün için planlanmış etkinlik yok.</p>
          ) : (
            <div className="space-y-3">
              {data?.bugun.randevular.map((r: any) => (
                <EventCard key={r.id} type="randevu" data={r} />
              ))}
              {data?.bugun.toplantilar.map((t: any) => (
                <EventCard key={t.id} type="toplanti" data={t} />
              ))}
            </div>
          )}
        </div>

        {/* Yarınki Etkinlikler */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Yarın
          </h2>
          
          {data?.yarin.randevular.length === 0 && 
           data?.yarin.toplantilar.length === 0 ? (
            <p className="text-gray-500">Yarın için planlanmış etkinlik yok.</p>
          ) : (
            <div className="space-y-3">
              {data?.yarin.randevular.map((r: any) => (
                <EventCard key={r.id} type="randevu" data={r} />
              ))}
              {data?.yarin.toplantilar.map((t: any) => (
                <EventCard key={t.id} type="toplanti" data={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({ title, value, icon, color }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function EventCard({ type, data }: { type: string; data: any }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`w-2 h-2 rounded-full ${
        type === 'randevu' ? 'bg-blue-500' : 'bg-green-500'
      }`} />
      <div className="flex-1">
        <p className="font-medium">{data.konu || data.baslik}</p>
        <p className="text-sm text-gray-500">
          {data.saat} - {data.yer || data.salon}
        </p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Best Practices

### 7.1 Query Key Conventions

```tsx
// Doğru: Tutarlı ve hiyerarşik
queryKey: ['araclar']                    // Liste
queryKey: ['arac', id]                   // Tekil
queryKey: ['araclar', { search, page }]  // Filtreli liste

// Yanlış: Tutarsız
queryKey: ['getAraclar']
queryKey: ['arac-list']
```

### 7.2 Optimistic Updates

```tsx
const updateMutation = useMutation({
  mutationFn: aracApi.update,
  onMutate: async (newData) => {
    // Önceki query'yi iptal et
    await queryClient.cancelQueries({ queryKey: ['araclar'] });
    
    // Mevcut veriyi kaydet
    const previous = queryClient.getQueryData(['araclar']);
    
    // Optimistic update
    queryClient.setQueryData(['araclar'], (old: any) => ({
      ...old,
      data: old.data.map((item: any) =>
        item.id === newData.id ? { ...item, ...newData.data } : item
      ),
    }));
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Hata durumunda geri al
    queryClient.setQueryData(['araclar'], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['araclar'] });
  },
});
```

### 7.3 Store Kullanım Kuralları

1. **UI State** → Zustand
2. **Server State** → React Query
3. **Form State** → React Hook Form
4. **Persist edilecek state** → Zustand persist middleware

### 7.4 Performance İpuçları

```tsx
// Selector kullanarak gereksiz re-render'ı önle
const sidebarOpen = useUIStore((state) => state.sidebarOpen);

// Birden fazla değer için shallow compare
import { shallow } from 'zustand/shallow';
const { search, page } = useFilterStore(
  (state) => ({ search: state.search, page: state.page }),
  shallow
);
```

---

## Sonraki Adımlar

Bu dokümanı tamamladıktan sonra:
1. ✅ Tüm store dosyalarını oluşturun
2. ✅ React Query provider'ı ekleyin
3. ✅ Her modül için API hook'ları yazın
4. ✅ Sayfalarda hook'ları kullanmaya başlayın

Devam: [09-DEPLOYMENT.md](./09-DEPLOYMENT.md)
