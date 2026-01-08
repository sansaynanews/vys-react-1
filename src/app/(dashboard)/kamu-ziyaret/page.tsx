"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/ui/DataTable";
import { useToastStore } from "@/hooks/useToastStore";
import { KamuZiyaretModal } from "./KamuZiyaretModal";
import dayjs from "dayjs";

interface KamuZiyaret {
  id: number;
  kurum: string | null;
  yer: string | null;
  tarih: string | null;
  saat: string | null;
  talepler: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function KamuZiyaretPage() {
  const [ziyaretler, setZiyaretler] = useState<KamuZiyaret[]>([]);
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
  const [selectedZiyaret, setSelectedZiyaret] = useState<KamuZiyaret | null>(null);

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

      const response = await fetch(`/api/kamu-ziyaret?${params}`);
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

  const handleEdit = (ziyaret: KamuZiyaret) => {
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
      render: (ziyaret: KamuZiyaret) => (
        <div className="text-sm">
          <div className="font-medium">
            {ziyaret.tarih ? dayjs(ziyaret.tarih).format("DD.MM.YYYY") : "-"}
          </div>
          {ziyaret.saat && <div className="text-gray-600">{ziyaret.saat}</div>}
        </div>
      ),
    },
    {
      key: "kurum",
      label: "Kurum",
      render: (ziyaret: KamuZiyaret) => (
        <div className="font-medium">{ziyaret.kurum || "-"}</div>
      ),
    },
    {
      key: "yer",
      label: "Yer",
      render: (ziyaret: KamuZiyaret) => (
        <div className="text-sm text-gray-600">{ziyaret.yer || "-"}</div>
      ),
    },
    {
      key: "talepler",
      label: "Talepler",
      render: (ziyaret: KamuZiyaret) => (
        <div className="text-sm text-gray-600 max-w-md truncate">
          {ziyaret.talepler || "-"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kamu Ziyaretleri</h1>
          <p className="text-sm text-gray-600 mt-1">Kamu kurumlarına yapılan ziyaret kayıtları</p>
        </div>
        <Button onClick={handleCreate}>Yeni Ziyaret</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ara (Kurum, Yer)"
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
          <div className="text-sm text-gray-600">Toplam Ziyaret</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Bu Ay</div>
          <div className="text-2xl font-bold text-blue-900">
            {ziyaretler.filter((z) => {
              if (!z.tarih) return false;
              const zTarih = dayjs(z.tarih);
              return zTarih.isSame(dayjs(), "month");
            }).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Bu Hafta</div>
          <div className="text-2xl font-bold text-green-900">
            {ziyaretler.filter((z) => {
              if (!z.tarih) return false;
              const zTarih = dayjs(z.tarih);
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
        <KamuZiyaretModal
          ziyaret={selectedZiyaret}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
