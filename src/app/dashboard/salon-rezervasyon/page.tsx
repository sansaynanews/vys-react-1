"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { SalonRezervasyonModal } from "./SalonRezervasyonModal";
import dayjs from "dayjs";

interface SalonRezarvasyon {
  id: number;
  salon_id: number;
  salon_ad: string | null;
  baslik: string | null;
  tur: string | null;
  rez_sahibi: string | null;
  departman: string | null;
  iletisim: string | null;
  tarih: string | null;
  bas_saat: string | null;
  bit_saat: string | null;
  tekrar_tipi: string | null;
  created_at: string | null;
  kararlar: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SalonRezervasyonPage() {
  const [rezervasyonlar, setRezervasyonlar] = useState<SalonRezarvasyon[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tarih, setTarih] = useState("");
  const [salonId, setSalonId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRezarvasyon, setSelectedRezarvasyon] = useState<SalonRezarvasyon | null>(null);

  const { showToast } = useToastStore();

  const fetchRezervasyonlar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tarih && { tarih }),
        ...(salonId && { salon_id: salonId }),
      });

      const response = await fetch(`/api/salon-rezervasyon?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Rezervasyonlar getirilemedi");
      }

      setRezervasyonlar(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRezervasyonlar();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRezervasyonlar();
  };

  const handleReset = () => {
    setSearch("");
    setTarih("");
    setSalonId("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchRezervasyonlar, 0);
  };

  const handleCreate = () => {
    setSelectedRezarvasyon(null);
    setModalOpen(true);
  };

  const handleEdit = (rezervasyon: SalonRezarvasyon) => {
    setSelectedRezarvasyon(rezervasyon);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedRezarvasyon(null);
    if (refresh) {
      fetchRezervasyonlar();
    }
  };

  const getTekrarBadge = (tekrar: string | null) => {
    switch (tekrar) {
      case "gunluk":
        return <Badge variant="info">Günlük</Badge>;
      case "haftalik":
        return <Badge variant="success">Haftalık</Badge>;
      case "aylik":
        return <Badge variant="warning">Aylık</Badge>;
      case "yok":
      default:
        return <Badge variant="default">Tekil</Badge>;
    }
  };

  const columns = [
    {
      key: "tarih",
      label: "Tarih/Saat",
      render: (rez: SalonRezarvasyon) => (
        <div className="text-sm">
          <div className="font-medium">
            {rez.tarih ? dayjs(rez.tarih).format("DD.MM.YYYY") : "-"}
          </div>
          {rez.bas_saat && rez.bit_saat && (
            <div className="text-gray-600">
              {rez.bas_saat} - {rez.bit_saat}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "salon",
      label: "Salon",
      render: (rez: SalonRezarvasyon) => (
        <div className="font-medium">{rez.salon_ad || `Salon ${rez.salon_id}`}</div>
      ),
    },
    {
      key: "baslik",
      label: "Başlık",
      render: (rez: SalonRezarvasyon) => (
        <div>
          <div className="font-medium">{rez.baslik || "-"}</div>
          {rez.tur && <div className="text-xs text-gray-600">{rez.tur}</div>}
        </div>
      ),
    },
    {
      key: "sahibi",
      label: "Rezervasyon Sahibi",
      render: (rez: SalonRezarvasyon) => (
        <div className="text-sm">
          <div>{rez.rez_sahibi || "-"}</div>
          {rez.departman && <div className="text-gray-600">{rez.departman}</div>}
        </div>
      ),
    },
    {
      key: "tekrar",
      label: "Tekrar",
      render: (rez: SalonRezarvasyon) => getTekrarBadge(rez.tekrar_tipi),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salon Rezervasyonları</h1>
          <p className="text-sm text-gray-600 mt-1">Toplantı salonu rezervasyon yönetimi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Rezervasyon</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ara (Başlık, Sahibi, Departman)"
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

          <Input
            label="Salon ID"
            type="number"
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            placeholder="Salon numarası..."
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
          <div className="text-sm text-gray-600">Toplam Rezervasyon</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Bugün</div>
          <div className="text-2xl font-bold text-blue-900">
            {rezervasyonlar.filter((r) => r.tarih === dayjs().format("YYYY-MM-DD")).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Bu Hafta</div>
          <div className="text-2xl font-bold text-green-900">
            {rezervasyonlar.filter((r) => {
              if (!r.tarih) return false;
              const rTarih = dayjs(r.tarih);
              return rTarih.isAfter(dayjs().startOf("week")) && rTarih.isBefore(dayjs().endOf("week"));
            }).length}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
          <div className="text-sm text-purple-700">Tekrarlanan</div>
          <div className="text-2xl font-bold text-purple-900">
            {rezervasyonlar.filter((r) => r.tekrar_tipi && r.tekrar_tipi !== "yok").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={rezervasyonlar}
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
        <SalonRezervasyonModal
          rezervasyon={selectedRezarvasyon}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
