"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { EvrakModal } from "./EvrakModal";

interface Evrak {
  id: number;
  gelen_kurum: string | null;
  tur: string | null;
  konu: string | null;
  notlar: string | null;
  evrak_tarih: string | null;
  evrak_sayi: string | null;
  gelis_tarih: string | null;
  teslim_alan: string | null;
  cikis_tarihi: string | null;
  sunus_tarihi: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function EvrakPage() {
  const [evraklar, setEvraklar] = useState<Evrak[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tur, setTur] = useState("");
  const [durum, setDurum] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvrak, setSelectedEvrak] = useState<Evrak | null>(null);

  const { showToast } = useToastStore();

  const fetchEvraklar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tur && { tur }),
        ...(durum && { durum }),
      });

      const response = await fetch(`/api/evrak?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Evraklar getirilemedi");
      }

      setEvraklar(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvraklar();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEvraklar();
  };

  const handleReset = () => {
    setSearch("");
    setTur("");
    setDurum("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchEvraklar, 0);
  };

  const handleCreate = () => {
    setSelectedEvrak(null);
    setModalOpen(true);
  };

  const handleEdit = (evrak: Evrak) => {
    setSelectedEvrak(evrak);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedEvrak(null);
    if (refresh) {
      fetchEvraklar();
    }
  };

  const getDurumBadge = (evrak: Evrak) => {
    if (evrak.sunus_tarihi) {
      return <Badge variant="success">Tamamlandı</Badge>;
    } else {
      return <Badge variant="warning">Bekliyor</Badge>;
    }
  };

  const columns = [
    {
      key: "evrak_tarih",
      label: "Evrak Tarihi",
      render: (evrak: Evrak) => evrak.evrak_tarih || "-",
    },
    {
      key: "evrak_sayi",
      label: "Evrak Sayısı",
      render: (evrak: Evrak) => evrak.evrak_sayi || "-",
    },
    {
      key: "gelen_kurum",
      label: "Gelen Kurum",
      render: (evrak: Evrak) => (
        <div>
          <div className="font-medium">{evrak.gelen_kurum}</div>
          <div className="text-sm text-gray-600">{evrak.tur}</div>
        </div>
      ),
    },
    {
      key: "konu",
      label: "Konu",
      render: (evrak: Evrak) => (
        <div className="max-w-xs truncate" title={evrak.konu || ""}>
          {evrak.konu}
        </div>
      ),
    },
    {
      key: "gelis_tarih",
      label: "Geliş Tarihi",
      render: (evrak: Evrak) => evrak.gelis_tarih || "-",
    },
    {
      key: "teslim_alan",
      label: "Teslim Alan",
      render: (evrak: Evrak) => evrak.teslim_alan || "-",
    },
    {
      key: "durum",
      label: "Durum",
      render: (evrak: Evrak) => getDurumBadge(evrak),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evrak Takip</h1>
          <p className="text-sm text-gray-600 mt-1">Gelen ve giden evrak takibi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Evrak</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Ara (Kurum, Konu, Evrak No)"
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
            label="Evrak Türü"
            value={tur}
            onChange={(e) => setTur(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Gelen">Gelen</option>
            <option value="Giden">Giden</option>
            <option value="İç Yazışma">İç Yazışma</option>
          </Select>

          <Select
            label="Durum"
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="bekliyor">Bekliyor</option>
            <option value="tamamlandi">Tamamlandı</option>
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
          <div className="text-sm text-gray-600">Toplam Evrak</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
          <div className="text-sm text-yellow-700">Bekleyen</div>
          <div className="text-2xl font-bold text-yellow-900">
            {evraklar.filter((e) => !e.sunus_tarihi).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Tamamlanan</div>
          <div className="text-2xl font-bold text-green-900">
            {evraklar.filter((e) => e.sunus_tarihi).length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={evraklar}
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
        <EvrakModal
          evrak={selectedEvrak}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
