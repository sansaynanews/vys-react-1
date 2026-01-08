"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { KonusmaMetniModal } from "./KonusmaMetniModal";
import dayjs from "dayjs";

interface KonusmaMetni {
  id: number;
  kategori: string;
  baslik: string;
  icerik: string;
  tarih: string | null;
  saat: any;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function KonusmaMetniPage() {
  const [metinler, setMetinler] = useState<KonusmaMetni[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetin, setSelectedMetin] = useState<KonusmaMetni | null>(null);

  const { showToast } = useToastStore();

  const fetchMetinler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(kategori && { kategori }),
      });

      const response = await fetch(`/api/konusma-metni?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Konuşma metinleri getirilemedi");
      }

      setMetinler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetinler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchMetinler();
  };

  const handleReset = () => {
    setSearch("");
    setKategori("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchMetinler, 0);
  };

  const handleCreate = () => {
    setSelectedMetin(null);
    setModalOpen(true);
  };

  const handleEdit = (metin: KonusmaMetni) => {
    setSelectedMetin(metin);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedMetin(null);
    if (refresh) {
      fetchMetinler();
    }
  };

  const getKategoriBadge = (kategori: string) => {
    const badges: Record<string, { variant: "default" | "success" | "danger" | "warning" | "info"; text: string }> = {
      "Açılış": { variant: "success", text: "Açılış" },
      "Kapanış": { variant: "danger", text: "Kapanış" },
      "Toplantı": { variant: "info", text: "Toplantı" },
      "Konferans": { variant: "warning", text: "Konferans" },
      "Protokol": { variant: "default", text: "Protokol" },
    };

    const badge = badges[kategori] || { variant: "default" as const, text: kategori };
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const columns = [
    {
      key: "kategori",
      label: "Kategori",
      render: (metin: KonusmaMetni) => getKategoriBadge(metin.kategori),
    },
    {
      key: "baslik",
      label: "Başlık",
      render: (metin: KonusmaMetni) => (
        <div className="font-medium">{metin.baslik}</div>
      ),
    },
    {
      key: "icerik",
      label: "İçerik Önizleme",
      render: (metin: KonusmaMetni) => (
        <div className="text-sm text-gray-600 truncate max-w-md">
          {metin.icerik.substring(0, 100)}
          {metin.icerik.length > 100 && "..."}
        </div>
      ),
    },
    {
      key: "tarih",
      label: "Tarih",
      render: (metin: KonusmaMetni) => (
        <div className="text-sm">
          {metin.tarih ? dayjs(metin.tarih).format("DD.MM.YYYY") : "-"}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Oluşturulma",
      render: (metin: KonusmaMetni) => (
        <div className="text-sm text-gray-600">
          {metin.created_at ? dayjs(metin.created_at).format("DD.MM.YYYY HH:mm") : "-"}
        </div>
      ),
    },
  ];

  const kategoriler = ["Açılış", "Kapanış", "Toplantı", "Konferans", "Protokol"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konuşma Metinleri</h1>
          <p className="text-sm text-gray-600 mt-1">Hazırlanan konuşma metinleri arşivi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Konuşma Metni</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ara (Başlık, İçerik)"
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
            label="Kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {kategoriler.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
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
          <div className="text-sm text-gray-600">Toplam Metin</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Açılış</div>
          <div className="text-2xl font-bold text-blue-900">
            {metinler.filter((m) => m.kategori === "Açılış").length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Toplantı</div>
          <div className="text-2xl font-bold text-green-900">
            {metinler.filter((m) => m.kategori === "Toplantı").length}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
          <div className="text-sm text-purple-700">Konferans</div>
          <div className="text-2xl font-bold text-purple-900">
            {metinler.filter((m) => m.kategori === "Konferans").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={metinler}
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
        <KonusmaMetniModal
          metin={selectedMetin}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
