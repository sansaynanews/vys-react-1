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
import { Sparkles, CalendarDays, Plus } from "lucide-react";

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
          {etkinlik.saat && <div className="text-slate-500 text-xs">{etkinlik.saat}</div>}
        </div>
      ),
    },
    {
      key: "adi",
      label: "Etkinlik Adı",
      render: (etkinlik: Etkinlik) => (
        <div>
          <div className="font-medium text-slate-900">{etkinlik.adi || "-"}</div>
          {etkinlik.tekrar_yillik && (
            <Badge variant="info" className="mt-1 text-[10px]">Yıllık Tekrar</Badge>
          )}
        </div>
      ),
    },
    {
      key: "kurum",
      label: "Kurum",
      render: (etkinlik: Etkinlik) => (
        <div className="text-sm text-slate-600">{etkinlik.kurum || "-"}</div>
      ),
    },
    {
      key: "yer",
      label: "Yer",
      render: (etkinlik: Etkinlik) => (
        <div className="text-sm text-slate-600">{etkinlik.yer || "-"}</div>
      ),
    },
    {
      key: "detay",
      label: "Detay",
      render: (etkinlik: Etkinlik) => (
        <div className="text-sm text-slate-500 max-w-md truncate">
          {etkinlik.detay || "-"}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 animate-gradient-x rounded-2xl p-6 shadow-2xl border border-white/5">

        {/* Header Content */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-white/80">Organizasyon</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Etkinlikler</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Kurum etkinlik takvimi ve planlanan organizasyonlar.
            </p>
          </div>

          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-none">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Etkinlik
          </Button>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
      </div>

      <div className="space-y-6">
        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500">Toplam Etkinlik</div>
            <div className="text-2xl font-bold text-slate-900">{pagination.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 bg-blue-50/30">
            <div className="text-sm text-blue-700">Bu Ay</div>
            <div className="text-2xl font-bold text-blue-900">
              {etkinlikler.filter((e) => {
                if (!e.tarih) return false;
                return dayjs(e.tarih).isSame(dayjs(), "month");
              }).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 bg-emerald-50/30">
            <div className="text-sm text-emerald-700">Gelecek Etkinlikler</div>
            <div className="text-2xl font-bold text-emerald-900">
              {etkinlikler.filter((e) => {
                if (!e.tarih) return false;
                return dayjs(e.tarih).isAfter(dayjs());
              }).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 bg-purple-50/30">
            <div className="text-sm text-purple-700">Yıllık Tekrar</div>
            <div className="text-2xl font-bold text-purple-900">
              {etkinlikler.filter((e) => e.tekrar_yillik).length}
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Ara (Ad, Kurum, Yer)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Arama..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-slate-50 border-slate-200"
            />

            <Input
              label="Tarih"
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="bg-slate-50 border-slate-200"
            />

            <Select
              label="Tekrar Durumu"
              value={tekrar}
              onChange={(e) => setTekrar(e.target.value)}
              className="bg-slate-50 border-slate-200"
            >
              <option value="">Tümü</option>
              <option value="true">Yıllık Tekrar Eden</option>
              <option value="false">Tekil Etkinlik</option>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={handleReset} variant="outline">
              Sıfırla
            </Button>
            <Button onClick={handleSearch} variant="primary">
              Ara
            </Button>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
