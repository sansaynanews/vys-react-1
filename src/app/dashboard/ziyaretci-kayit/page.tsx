"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { ZiyaretciKayitModal } from "./ZiyaretciKayitModal";
import dayjs from "dayjs";

interface ZiyaretciKayit {
  id: number;
  ad_soyad: string;
  unvan: string | null;
  kurum: string | null;
  iletisim: string | null;
  giris_tarihi: string;
  giris_saati: string;
  cikis_saati: string | null;
  kisi_sayisi: number | null;
  diger_kisiler: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ZiyaretciKayitPage() {
  const [kayitlar, setKayitlar] = useState<ZiyaretciKayit[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tarih, setTarih] = useState("");
  const [aktif, setAktif] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKayit, setSelectedKayit] = useState<ZiyaretciKayit | null>(null);

  const { showToast } = useToastStore();

  const fetchKayitlar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tarih && { tarih }),
        ...(aktif && { aktif }),
      });

      const response = await fetch(`/api/ziyaretci-kayit?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kayıtlar getirilemedi");
      }

      setKayitlar(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKayitlar();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchKayitlar();
  };

  const handleReset = () => {
    setSearch("");
    setTarih("");
    setAktif("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchKayitlar, 0);
  };

  const handleCreate = () => {
    setSelectedKayit(null);
    setModalOpen(true);
  };

  const handleEdit = (kayit: ZiyaretciKayit) => {
    setSelectedKayit(kayit);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedKayit(null);
    if (refresh) {
      fetchKayitlar();
    }
  };

  const getDurumBadge = (cikis: string | null) => {
    if (cikis) {
      return <Badge variant="default">Çıkış Yapıldı</Badge>;
    }
    return <Badge variant="success">İçeride</Badge>;
  };

  const columns = [
    {
      key: "durum",
      label: "Durum",
      render: (kayit: ZiyaretciKayit) => getDurumBadge(kayit.cikis_saati),
    },
    {
      key: "tarih_saat",
      label: "Giriş Tarih/Saat",
      render: (kayit: ZiyaretciKayit) => (
        <div className="text-sm">
          <div className="font-medium">{dayjs(kayit.giris_tarihi).format("DD.MM.YYYY")}</div>
          <div className="text-gray-600">{kayit.giris_saati}</div>
        </div>
      ),
    },
    {
      key: "ad_soyad",
      label: "Ziyaretçi",
      render: (kayit: ZiyaretciKayit) => (
        <div>
          <div className="font-medium">{kayit.ad_soyad}</div>
          {kayit.unvan && <div className="text-xs text-gray-600">{kayit.unvan}</div>}
        </div>
      ),
    },
    {
      key: "kurum",
      label: "Kurum",
      render: (kayit: ZiyaretciKayit) => (
        <div className="text-sm text-gray-600">{kayit.kurum || "-"}</div>
      ),
    },
    {
      key: "kisi_sayisi",
      label: "Kişi Sayısı",
      render: (kayit: ZiyaretciKayit) => (
        <div className="text-sm text-center">{kayit.kisi_sayisi || 1}</div>
      ),
    },
    {
      key: "cikis",
      label: "Çıkış Saati",
      render: (kayit: ZiyaretciKayit) => (
        <div className="text-sm text-gray-600">{kayit.cikis_saati || "-"}</div>
      ),
    },
  ];

  const aktifZiyaretciler = kayitlar.filter((k) => !k.cikis_saati).length;
  const toplamKisi = kayitlar.reduce((sum, k) => sum + (k.kisi_sayisi || 1), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ziyaretçi Kayıtları</h1>
          <p className="text-sm text-gray-600 mt-1">Bina giriş-çıkış kayıt sistemi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Ziyaretçi</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ara (Ad Soyad, Kurum, Unvan)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Arama..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <Input
            label="Giriş Tarihi"
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
          />

          <Select
            label="Durum"
            value={aktif}
            onChange={(e) => setAktif(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="true">Aktif (İçeride)</option>
            <option value="false">Çıkış Yapıldı</option>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} variant="primary">
            Ara
          </Button>
          <Button onClick={handleReset} variant="outline">
            Sıfırla
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Kayıt</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Aktif Ziyaretçi</div>
          <div className="text-2xl font-bold text-green-900">{aktifZiyaretciler}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Bugün Giriş</div>
          <div className="text-2xl font-bold text-blue-900">
            {kayitlar.filter((k) => k.giris_tarihi === dayjs().format("YYYY-MM-DD")).length}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
          <div className="text-sm text-purple-700">Toplam Kişi</div>
          <div className="text-2xl font-bold text-purple-900">{toplamKisi}</div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={kayitlar}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, page }))
          }
          onRowClick={handleEdit}
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <ZiyaretciKayitModal
          kayit={selectedKayit}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
