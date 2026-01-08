"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { ProjeModal } from "./ProjeModal";
import dayjs from "dayjs";

interface Proje {
  id: number;
  konu: string;
  sahibi: string;
  kurum: string | null;
  iletisim: string | null;
  baslangic: string | null;
  bitis: string | null;
  durum: string | null;
  hedefler: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProjePage() {
  const [projeler, setProjeler] = useState<Proje[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProje, setSelectedProje] = useState<Proje | null>(null);

  const { showToast } = useToastStore();

  const fetchProjeler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(durum && { durum }),
      });

      const response = await fetch(`/api/proje?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Projeler getirilemedi");
      }

      setProjeler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjeler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProjeler();
  };

  const handleReset = () => {
    setSearch("");
    setDurum("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchProjeler, 0);
  };

  const handleCreate = () => {
    setSelectedProje(null);
    setModalOpen(true);
  };

  const handleEdit = (proje: Proje) => {
    setSelectedProje(proje);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedProje(null);
    if (refresh) {
      fetchProjeler();
    }
  };

  const getDurumBadge = (durum: string | null) => {
    switch (durum) {
      case "Tamamlandı":
        return <Badge variant="success">Tamamlandı</Badge>;
      case "Devam Ediyor":
        return <Badge variant="info">Devam Ediyor</Badge>;
      case "Beklemede":
        return <Badge variant="warning">Beklemede</Badge>;
      case "İptal":
        return <Badge variant="danger">İptal</Badge>;
      default:
        return <Badge variant="default">{durum || "Belirsiz"}</Badge>;
    }
  };

  const columns = [
    {
      key: "konu",
      label: "Proje Konusu",
      render: (proje: Proje) => (
        <div className="font-medium">{proje.konu}</div>
      ),
    },
    {
      key: "sahibi",
      label: "Proje Sahibi",
      render: (proje: Proje) => (
        <div>
          <div className="text-sm">{proje.sahibi}</div>
          {proje.kurum && <div className="text-xs text-gray-600">{proje.kurum}</div>}
        </div>
      ),
    },
    {
      key: "tarihler",
      label: "Tarihler",
      render: (proje: Proje) => (
        <div className="text-sm">
          <div>
            {proje.baslangic ? dayjs(proje.baslangic).format("DD.MM.YYYY") : "-"}
          </div>
          {proje.bitis && (
            <div className="text-gray-600">
              → {dayjs(proje.bitis).format("DD.MM.YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "durum",
      label: "Durum",
      render: (proje: Proje) => getDurumBadge(proje.durum),
    },
    {
      key: "iletisim",
      label: "İletişim",
      render: (proje: Proje) => (
        <div className="text-sm text-gray-600">{proje.iletisim || "-"}</div>
      ),
    },
  ];

  const durumlar = ["Beklemede", "Devam Ediyor", "Tamamlandı", "İptal"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proje Yönetimi</h1>
          <p className="text-sm text-gray-600 mt-1">Proje takip ve yönetim sistemi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Proje</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ara (Konu, Sahibi, Kurum)"
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
            <option value="">Tüm Durumlar</option>
            {durumlar.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
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
          <div className="text-sm text-gray-600">Toplam Proje</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Devam Ediyor</div>
          <div className="text-2xl font-bold text-blue-900">
            {projeler.filter((p) => p.durum === "Devam Ediyor").length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Tamamlandı</div>
          <div className="text-2xl font-bold text-green-900">
            {projeler.filter((p) => p.durum === "Tamamlandı").length}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
          <div className="text-sm text-yellow-700">Beklemede</div>
          <div className="text-2xl font-bold text-yellow-900">
            {projeler.filter((p) => p.durum === "Beklemede").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={projeler}
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
        <ProjeModal
          proje={selectedProje}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
