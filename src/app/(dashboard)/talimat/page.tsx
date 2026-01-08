"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { TalimatModal } from "./TalimatModal";

interface Talimat {
  id: number;
  konu: string;
  verilen_kisi: string;
  kurum: string | null;
  iletisim: string | null;
  tarih: string | null;
  durum: string | null;
  icerik: string | null;
  onem_derecesi: string | null;
  saat: any;
  tamamlanma_tarihi: string | null;
  tamamlayan_kisi: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TalimatPage() {
  const [talimatlar, setTalimatlar] = useState<Talimat[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState("");
  const [onemDerecesi, setOnemDerecesi] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTalimat, setSelectedTalimat] = useState<Talimat | null>(null);

  const { showToast } = useToastStore();

  const fetchTalimatlar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(durum && { durum }),
        ...(onemDerecesi && { onem_derecesi: onemDerecesi }),
      });

      const response = await fetch(`/api/talimat?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Talimatlar getirilemedi");
      }

      setTalimatlar(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalimatlar();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTalimatlar();
  };

  const handleReset = () => {
    setSearch("");
    setDurum("");
    setOnemDerecesi("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchTalimatlar, 0);
  };

  const handleCreate = () => {
    setSelectedTalimat(null);
    setModalOpen(true);
  };

  const handleEdit = (talimat: Talimat) => {
    setSelectedTalimat(talimat);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedTalimat(null);
    if (refresh) {
      fetchTalimatlar();
    }
  };

  const getDurumBadge = (durum: string | null) => {
    switch (durum) {
      case "Tamamlandı":
        return <Badge variant="success">Tamamlandı</Badge>;
      case "İptal":
        return <Badge variant="danger">İptal</Badge>;
      case "Devam Ediyor":
        return <Badge variant="info">Devam Ediyor</Badge>;
      case "Beklemede":
      default:
        return <Badge variant="warning">Beklemede</Badge>;
    }
  };

  const getOnemBadge = (onem: string | null) => {
    switch (onem) {
      case "Acil":
        return <Badge variant="danger">Acil</Badge>;
      case "Yüksek":
        return <Badge variant="warning">Yüksek</Badge>;
      case "Normal":
      default:
        return <Badge variant="default">Normal</Badge>;
    }
  };

  const columns = [
    {
      key: "tarih",
      label: "Tarih",
      render: (talimat: Talimat) => talimat.tarih || "-",
    },
    {
      key: "konu",
      label: "Konu",
      render: (talimat: Talimat) => (
        <div>
          <div className="font-medium max-w-xs truncate" title={talimat.konu}>
            {talimat.konu}
          </div>
          <div className="text-sm text-gray-600">{talimat.verilen_kisi}</div>
        </div>
      ),
    },
    {
      key: "kurum",
      label: "Kurum",
      render: (talimat: Talimat) => talimat.kurum || "-",
    },
    {
      key: "onem",
      label: "Önem",
      render: (talimat: Talimat) => getOnemBadge(talimat.onem_derecesi),
    },
    {
      key: "durum",
      label: "Durum",
      render: (talimat: Talimat) => getDurumBadge(talimat.durum),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talimat Takip</h1>
          <p className="text-sm text-gray-600 mt-1">Talimat ve görev takip sistemi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Talimat</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Ara (Konu, Verilen Kişi, Kurum)"
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
            label="Durum"
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Beklemede">Beklemede</option>
            <option value="Devam Ediyor">Devam Ediyor</option>
            <option value="Tamamlandı">Tamamlandı</option>
            <option value="İptal">İptal</option>
          </Select>

          <Select
            label="Önem Derecesi"
            value={onemDerecesi}
            onChange={(e) => setOnemDerecesi(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Normal">Normal</option>
            <option value="Yüksek">Yüksek</option>
            <option value="Acil">Acil</option>
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
          <div className="text-sm text-gray-600">Toplam Talimat</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
          <div className="text-sm text-yellow-700">Beklemede</div>
          <div className="text-2xl font-bold text-yellow-900">
            {talimatlar.filter((t) => t.durum === "Beklemede").length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Devam Ediyor</div>
          <div className="text-2xl font-bold text-blue-900">
            {talimatlar.filter((t) => t.durum === "Devam Ediyor").length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Tamamlandı</div>
          <div className="text-2xl font-bold text-green-900">
            {talimatlar.filter((t) => t.durum === "Tamamlandı").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={talimatlar}
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
        <TalimatModal
          talimat={selectedTalimat}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
