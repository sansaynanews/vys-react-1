"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { VipZiyaretModal } from "./VipZiyaretModal";
import dayjs from "dayjs";

interface VipZiyaret {
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

export default function VipZiyaretPage() {
  const [ziyaretler, setZiyaretler] = useState<VipZiyaret[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [protokolTuru, setProtokolTuru] = useState("");
  const [durum, setDurum] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedZiyaret, setSelectedZiyaret] = useState<VipZiyaret | null>(null);

  const { showToast } = useToastStore();

  const fetchZiyaretler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(protokolTuru && { protokol_turu: protokolTuru }),
        ...(durum && { durum }),
      });

      const response = await fetch(`/api/vip-ziyaret?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "VIP ziyaretler getirilemedi");
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
    setProtokolTuru("");
    setDurum("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchZiyaretler, 0);
  };

  const handleCreate = () => {
    setSelectedZiyaret(null);
    setModalOpen(true);
  };

  const handleEdit = (ziyaret: VipZiyaret) => {
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

  const getDurumBadge = (gelisTarihi: string | null) => {
    if (!gelisTarihi) return <Badge variant="default">Tarih Yok</Badge>;

    const tarih = dayjs(gelisTarihi);
    const today = dayjs();

    if (tarih.isAfter(today, "day")) {
      return <Badge variant="info">Gelecek</Badge>;
    } else if (tarih.isSame(today, "day")) {
      return <Badge variant="warning">Bugün</Badge>;
    } else {
      return <Badge variant="default">Geçmiş</Badge>;
    }
  };

  const columns = [
    {
      key: "tarih",
      label: "Geliş Tarihi/Saati",
      render: (ziyaret: VipZiyaret) => (
        <div className="text-sm">
          <div>{ziyaret.gelis_tarihi || "-"}</div>
          {ziyaret.gelis_saati && <div className="text-gray-600">{ziyaret.gelis_saati}</div>}
        </div>
      ),
    },
    {
      key: "protokol",
      label: "Protokol Bilgileri",
      render: (ziyaret: VipZiyaret) => (
        <div>
          <div className="font-medium">{ziyaret.ad_soyad}</div>
          <div className="text-sm text-gray-600">{ziyaret.protokol_turu}</div>
        </div>
      ),
    },
    {
      key: "karsilama",
      label: "Karşılama Yeri",
      render: (ziyaret: VipZiyaret) => ziyaret.karsilama_yeri || "-",
    },
    {
      key: "konaklama",
      label: "Konaklama",
      render: (ziyaret: VipZiyaret) => ziyaret.konaklama_yeri || "-",
    },
    {
      key: "durum",
      label: "Durum",
      render: (ziyaret: VipZiyaret) => getDurumBadge(ziyaret.gelis_tarihi),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VIP Ziyaret Yönetimi</h1>
          <p className="text-sm text-gray-600 mt-1">Üst düzey protokol ziyaretleri</p>
        </div>
        <Button onClick={handleCreate}>Yeni Ziyaret</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Ara (Ad Soyad, Yer)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Arama..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <Select
            label="Protokol Türü"
            value={protokolTuru}
            onChange={(e) => setProtokolTuru(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Bakan">Bakan</option>
            <option value="Vali">Vali</option>
            <option value="Milletvekili">Milletvekili</option>
            <option value="Büyükelçi">Büyükelçi</option>
            <option value="Diğer">Diğer</option>
          </Select>

          <Select
            label="Durum"
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="gelecek">Gelecek</option>
            <option value="gecmis">Geçmiş</option>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Ziyaret</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Gelecek Ziyaretler</div>
          <div className="text-2xl font-bold text-blue-900">
            {ziyaretler.filter((z) => z.gelis_tarihi && dayjs(z.gelis_tarihi).isAfter(dayjs(), "day")).length}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
          <div className="text-sm text-yellow-700">Bugünkü Ziyaretler</div>
          <div className="text-2xl font-bold text-yellow-900">
            {ziyaretler.filter((z) => z.gelis_tarihi && dayjs(z.gelis_tarihi).isSame(dayjs(), "day")).length}
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
        <VipZiyaretModal
          ziyaret={selectedZiyaret}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
