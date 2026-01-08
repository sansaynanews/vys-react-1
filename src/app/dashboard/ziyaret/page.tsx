"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/ui/DataTable";
import { useToastStore } from "@/hooks/useToastStore";
import { ZiyaretModal } from "./ZiyaretModal";
import dayjs from "dayjs";

interface Ziyaret {
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

export default function ZiyaretPage() {
  const [ziyaretler, setZiyaretler] = useState<Ziyaret[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tarih, setTarih] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedZiyaret, setSelectedZiyaret] = useState<Ziyaret | null>(null);

  const { showToast } = useToastStore();

  const fetchZiyaretler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tarih && { tarih }),
      });

      const response = await fetch(`/api/ziyaret?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ziyaretçiler getirilemedi");
      }

      setZiyaretler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZiyaretler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchZiyaretler();
  };

  const handleReset = () => {
    setSearch("");
    setTarih("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchZiyaretler, 0);
  };

  const handleCreate = () => {
    setSelectedZiyaret(null);
    setModalOpen(true);
  };

  const handleEdit = (ziyaret: Ziyaret) => {
    setSelectedZiyaret(ziyaret);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedZiyaret(null);
    if (refresh) {
      fetchZiyaretler();
    }
  };

  const columns = [
    {
      key: "tarih",
      label: "Tarih/Saat",
      render: (ziyaret: Ziyaret) => (
        <div className="text-sm">
          <div>{ziyaret.giris_tarihi}</div>
          <div className="text-gray-600">
            {ziyaret.giris_saati}
            {ziyaret.cikis_saati && ` - ${ziyaret.cikis_saati}`}
          </div>
        </div>
      ),
    },
    {
      key: "ziyaretci",
      label: "Ziyaretçi",
      render: (ziyaret: Ziyaret) => (
        <div>
          <div className="font-medium">{ziyaret.ad_soyad}</div>
          <div className="text-sm text-gray-600">{ziyaret.unvan}</div>
        </div>
      ),
    },
    {
      key: "kurum",
      label: "Kurum",
      render: (ziyaret: Ziyaret) => ziyaret.kurum || "-",
    },
    {
      key: "iletisim",
      label: "İletişim",
      render: (ziyaret: Ziyaret) => ziyaret.iletisim || "-",
    },
    {
      key: "kisi_sayisi",
      label: "Kişi Sayısı",
      render: (ziyaret: Ziyaret) => ziyaret.kisi_sayisi || 1,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ziyaretçi Kayıtları</h1>
          <p className="text-sm text-gray-600 mt-1">Gelen ziyaretçi takip sistemi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Ziyaretçi</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ara (Ad Soyad, Kurum, İletişim)"
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
            label="Tarih"
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
          />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Ziyaretçi</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Bugünkü Ziyaretçi</div>
          <div className="text-2xl font-bold text-blue-900">
            {ziyaretler.filter((z) => z.giris_tarihi === dayjs().format("YYYY-MM-DD")).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Toplam Kişi Sayısı</div>
          <div className="text-2xl font-bold text-green-900">
            {ziyaretler.reduce((sum, z) => sum + (z.kisi_sayisi || 1), 0)}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={ziyaretler}
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
        <ZiyaretModal
          ziyaret={selectedZiyaret}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
