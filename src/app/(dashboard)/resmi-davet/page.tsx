"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { ResmiDavetModal } from "./ResmiDavetModal";
import dayjs from "dayjs";

interface ResmiDavet {
  id: number;
  tur: string | null;
  sahip: string | null;
  tarih: string | null;
  saat: string | null;
  yer: string | null;
  aciklama: string | null;
  getiren: string | null;
  gelis_sekli: string | null;
  iletisim: string | null;
  gelis_tarih: string | null;
  gelis_saat: string | null;
  katilim_durumu: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ResmiDavetPage() {
  const [davetler, setDavetler] = useState<ResmiDavet[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tur, setTur] = useState("");
  const [katilimDurumu, setKatilimDurumu] = useState("");
  const [durum, setDurum] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDavet, setSelectedDavet] = useState<ResmiDavet | null>(null);

  const { showToast } = useToastStore();

  const fetchDavetler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tur && { tur }),
        ...(katilimDurumu && { katilim_durumu: katilimDurumu }),
        ...(durum && { durum }),
      });

      const response = await fetch(`/api/resmi-davet?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resmi davetler getirilemedi");
      }

      setDavetler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDavetler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchDavetler();
  };

  const handleReset = () => {
    setSearch("");
    setTur("");
    setKatilimDurumu("");
    setDurum("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchDavetler, 0);
  };

  const handleCreate = () => {
    setSelectedDavet(null);
    setModalOpen(true);
  };

  const handleEdit = (davet: ResmiDavet) => {
    setSelectedDavet(davet);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedDavet(null);
    if (refresh) {
      fetchDavetler();
    }
  };

  const getKatilimBadge = (katilim: string | null) => {
    switch (katilim) {
      case "Katılacak":
        return <Badge variant="success">Katılacak</Badge>;
      case "Katılmayacak":
        return <Badge variant="danger">Katılmayacak</Badge>;
      case "Belirsiz":
      default:
        return <Badge variant="warning">Belirsiz</Badge>;
    }
  };

  const columns = [
    {
      key: "tarih",
      label: "Davet Tarihi/Saati",
      render: (davet: ResmiDavet) => (
        <div className="text-sm">
          <div>{davet.tarih || "-"}</div>
          {davet.saat && <div className="text-gray-600">{davet.saat}</div>}
        </div>
      ),
    },
    {
      key: "davet",
      label: "Davet Bilgileri",
      render: (davet: ResmiDavet) => (
        <div>
          <div className="font-medium">{davet.sahip}</div>
          <div className="text-sm text-gray-600">{davet.tur}</div>
        </div>
      ),
    },
    {
      key: "yer",
      label: "Yer",
      render: (davet: ResmiDavet) => (
        <div className="text-sm max-w-xs truncate" title={davet.yer || ""}>
          {davet.yer || "-"}
        </div>
      ),
    },
    {
      key: "getiren",
      label: "Getiren",
      render: (davet: ResmiDavet) => davet.getiren || "-",
    },
    {
      key: "katilim",
      label: "Katılım",
      render: (davet: ResmiDavet) => getKatilimBadge(davet.katilim_durumu),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resmi Davet Yönetimi</h1>
          <p className="text-sm text-gray-600 mt-1">Resmi davet ve katılım takibi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Davet</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Ara (Sahibi, Yer, Getiren)"
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
            label="Davet Türü"
            value={tur}
            onChange={(e) => setTur(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Resmi Tören">Resmi Tören</option>
            <option value="Kokteyl">Kokteyl</option>
            <option value="Yemek">Yemek</option>
            <option value="Toplantı">Toplantı</option>
            <option value="Diğer">Diğer</option>
          </Select>

          <Select
            label="Katılım Durumu"
            value={katilimDurumu}
            onChange={(e) => setKatilimDurumu(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Katılacak">Katılacak</option>
            <option value="Katılmayacak">Katılmayacak</option>
            <option value="Belirsiz">Belirsiz</option>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Davet</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Katılacak</div>
          <div className="text-2xl font-bold text-green-900">
            {davetler.filter((d) => d.katilim_durumu === "Katılacak").length}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="text-sm text-red-700">Katılmayacak</div>
          <div className="text-2xl font-bold text-red-900">
            {davetler.filter((d) => d.katilim_durumu === "Katılmayacak").length}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
          <div className="text-sm text-yellow-700">Belirsiz</div>
          <div className="text-2xl font-bold text-yellow-900">
            {davetler.filter((d) => !d.katilim_durumu || d.katilim_durumu === "Belirsiz").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={davetler}
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
        <ResmiDavetModal
          davet={selectedDavet}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
