"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { UstDuzeyZiyaretModal } from "./UstDuzeyZiyaretModal";
import dayjs from "dayjs";

interface UstDuzeyZiyaret {
  id: number;
  protokol_turu: string | null;
  ad_soyad: string | null;
  gelis_tarihi: string | null;
  gelis_saati: string | null;
  karsilama_yeri: string | null;
  konaklama_yeri: string | null;
  notlar: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UstDuzeyZiyaretPage() {
  const [ziyaretler, setZiyaretler] = useState<UstDuzeyZiyaret[]>([]);
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
  const [selectedZiyaret, setSelectedZiyaret] = useState<UstDuzeyZiyaret | null>(null);

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

      const response = await fetch(`/api/ust-duzey-ziyaret?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ziyaretler getirilemedi");
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

  const handleEdit = (ziyaret: UstDuzeyZiyaret) => {
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

  const getProtokolBadge = (protokol: string | null) => {
    if (!protokol) return <Badge variant="default">-</Badge>;

    const badges: Record<string, { variant: "default" | "success" | "danger" | "warning" | "info" }> = {
      "Bakan": { variant: "danger" },
      "Vali": { variant: "success" },
      "Milletvekili": { variant: "info" },
      "Genel Müdür": { variant: "warning" },
    };

    const badge = badges[protokol] || { variant: "default" as const };
    return <Badge variant={badge.variant}>{protokol}</Badge>;
  };

  const columns = [
    {
      key: "tarih",
      label: "Geliş Tarihi/Saati",
      render: (ziyaret: UstDuzeyZiyaret) => (
        <div className="text-sm">
          <div className="font-medium">
            {ziyaret.gelis_tarihi ? dayjs(ziyaret.gelis_tarihi).format("DD.MM.YYYY") : "-"}
          </div>
          {ziyaret.gelis_saati && <div className="text-gray-600">{ziyaret.gelis_saati}</div>}
        </div>
      ),
    },
    {
      key: "protokol",
      label: "Protokol Türü",
      render: (ziyaret: UstDuzeyZiyaret) => getProtokolBadge(ziyaret.protokol_turu),
    },
    {
      key: "ad_soyad",
      label: "Ziyaretçi",
      render: (ziyaret: UstDuzeyZiyaret) => (
        <div className="font-medium">{ziyaret.ad_soyad || "-"}</div>
      ),
    },
    {
      key: "karsilama",
      label: "Karşılama Yeri",
      render: (ziyaret: UstDuzeyZiyaret) => (
        <div className="text-sm text-gray-600">{ziyaret.karsilama_yeri || "-"}</div>
      ),
    },
    {
      key: "konaklama",
      label: "Konaklama",
      render: (ziyaret: UstDuzeyZiyaret) => (
        <div className="text-sm text-gray-600">{ziyaret.konaklama_yeri || "-"}</div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Üst Düzey Ziyaretler</h1>
          <p className="text-sm text-gray-600 mt-1">Protokol seviyesinde üst düzey ziyaret yönetimi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Ziyaret</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ara (Ad Soyad, Protokol, Karşılama Yeri)"
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
            label="Geliş Tarihi"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Ziyaret</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Bu Ay</div>
          <div className="text-2xl font-bold text-blue-900">
            {ziyaretler.filter((z) => {
              if (!z.gelis_tarihi) return false;
              return dayjs(z.gelis_tarihi).isSame(dayjs(), "month");
            }).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Gelecek Ziyaretler</div>
          <div className="text-2xl font-bold text-green-900">
            {ziyaretler.filter((z) => {
              if (!z.gelis_tarihi) return false;
              return dayjs(z.gelis_tarihi).isAfter(dayjs());
            }).length}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
          <div className="text-sm text-purple-700">Bu Hafta</div>
          <div className="text-2xl font-bold text-purple-900">
            {ziyaretler.filter((z) => {
              if (!z.gelis_tarihi) return false;
              const zTarih = dayjs(z.gelis_tarihi);
              return zTarih.isAfter(dayjs().startOf("week")) && zTarih.isBefore(dayjs().endOf("week"));
            }).length}
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
        <UstDuzeyZiyaretModal
          ziyaret={selectedZiyaret}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
