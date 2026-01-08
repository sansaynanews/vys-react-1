"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { EtkinlikModal } from "./EtkinlikModal";
import dayjs from "dayjs";

interface Etkinlik {
  id: number;
  adi: string | null;
  kurum: string | null;
  tarih: string | null;
  orijinal_tarih: string | null;
  saat: string | null;
  yer: string | null;
  detay: string | null;
  created_at: string | null;
  tekrar_yillik: boolean | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function EtkinlikPage() {
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tarih, setTarih] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEtkinlik, setSelectedEtkinlik] = useState<Etkinlik | null>(null);

  const { showToast } = useToastStore();

  const fetchEtkinlikler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tarih && { tarih }),
        ...(tekrar && { tekrar }),
      });

      const response = await fetch(`/api/etkinlik?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Etkinlikler getirilemedi");
      }

      setEtkinlikler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtkinlikler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEtkinlikler();
  };

  const handleReset = () => {
    setSearch("");
    setTarih("");
    setTekrar("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchEtkinlikler, 0);
  };

  const handleCreate = () => {
    setSelectedEtkinlik(null);
    setModalOpen(true);
  };

  const handleEdit = (etkinlik: Etkinlik) => {
    setSelectedEtkinlik(etkinlik);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedEtkinlik(null);
    if (refresh) {
      fetchEtkinlikler();
    }
  };

  const columns = [
    {
      key: "tarih",
      label: "Tarih/Saat",
      render: (etkinlik: Etkinlik) => (
        <div className="text-sm">
          <div className="font-medium">
            {etkinlik.tarih ? dayjs(etkinlik.tarih).format("DD.MM.YYYY") : "-"}
          </div>
          {etkinlik.saat && <div className="text-gray-600">{etkinlik.saat}</div>}
        </div>
      ),
    },
    {
      key: "adi",
      label: "Etkinlik Adı",
      render: (etkinlik: Etkinlik) => (
        <div>
          <div className="font-medium">{etkinlik.adi || "-"}</div>
          {etkinlik.tekrar_yillik && (
            <Badge variant="info" className="mt-1">Yıllık Tekrar</Badge>
          )}
        </div>
      ),
    },
    {
      key: "kurum",
      label: "Kurum",
      render: (etkinlik: Etkinlik) => (
        <div className="text-sm text-gray-600">{etkinlik.kurum || "-"}</div>
      ),
    },
    {
      key: "yer",
      label: "Yer",
      render: (etkinlik: Etkinlik) => (
        <div className="text-sm text-gray-600">{etkinlik.yer || "-"}</div>
      ),
    },
    {
      key: "detay",
      label: "Detay",
      render: (etkinlik: Etkinlik) => (
        <div className="text-sm text-gray-600 max-w-md truncate">
          {etkinlik.detay || "-"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>
          <p className="text-sm text-gray-600 mt-1">Etkinlik takvimi ve yönetimi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Etkinlik</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ara (Ad, Kurum, Yer)"
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

          <Select
            label="Tekrar Durumu"
            value={tekrar}
            onChange={(e) => setTekrar(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="true">Yıllık Tekrar Eden</option>
            <option value="false">Tekil Etkinlik</option>
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
          <div className="text-sm text-gray-600">Toplam Etkinlik</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Bu Ay</div>
          <div className="text-2xl font-bold text-blue-900">
            {etkinlikler.filter((e) => {
              if (!e.tarih) return false;
              return dayjs(e.tarih).isSame(dayjs(), "month");
            }).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Gelecek Etkinlikler</div>
          <div className="text-2xl font-bold text-green-900">
            {etkinlikler.filter((e) => {
              if (!e.tarih) return false;
              return dayjs(e.tarih).isAfter(dayjs());
            }).length}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
          <div className="text-sm text-purple-700">Yıllık Tekrar</div>
          <div className="text-2xl font-bold text-purple-900">
            {etkinlikler.filter((e) => e.tekrar_yillik).length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={etkinlikler}
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
        <EtkinlikModal
          etkinlik={selectedEtkinlik}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
