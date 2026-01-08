"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { HareketModal } from "./HareketModal";
import Link from "next/link";

interface Hareket {
  id: number;
  tur: string;
  adi: string;
  cesit: string;
  alinan: string | null;
  verilen: string | null;
  miktar: number;
  kalan_stok: number;
  tarih: string;
  saat: string | null;
  personel: string | null;
  stok_turu: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function StokHareketPage() {
  const [hareketler, setHareketler] = useState<Hareket[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [tur, setTur] = useState("");
  const [stokTuru, setStokTuru] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { showToast } = useToastStore();

  const fetchHareketler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(tur && { tur }),
        ...(stokTuru && { stok_turu: stokTuru }),
      });

      const response = await fetch(`/api/stok/hareket?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Hareketler getirilemedi");
      }

      setHareketler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHareketler();
  }, [pagination.page, pagination.limit, tur, stokTuru]);

  const handleReset = () => {
    setTur("");
    setStokTuru("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    if (refresh) {
      fetchHareketler();
    }
  };

  const getTurBadge = (tur: string) => {
    return tur === "giris" ? (
      <Badge variant="success">Giriş</Badge>
    ) : (
      <Badge variant="danger">Çıkış</Badge>
    );
  };

  const columns = [
    {
      key: "tarih",
      label: "Tarih/Saat",
      render: (hareket: Hareket) => (
        <div className="text-sm">
          <div>{hareket.tarih}</div>
          {hareket.saat && <div className="text-gray-600">{hareket.saat}</div>}
        </div>
      ),
    },
    {
      key: "tur",
      label: "İşlem Türü",
      render: (hareket: Hareket) => getTurBadge(hareket.tur),
    },
    {
      key: "urun",
      label: "Ürün",
      render: (hareket: Hareket) => (
        <div>
          <div className="font-medium">{hareket.adi}</div>
          <div className="text-sm text-gray-600">{hareket.cesit}</div>
        </div>
      ),
    },
    {
      key: "miktar",
      label: "Miktar",
      render: (hareket: Hareket) => (
        <span className="font-medium">{hareket.miktar} Adet</span>
      ),
    },
    {
      key: "kalan",
      label: "Kalan Stok",
      render: (hareket: Hareket) => (
        <span className="text-gray-700">{hareket.kalan_stok} Adet</span>
      ),
    },
    {
      key: "alinan_verilen",
      label: "Alınan/Verilen",
      render: (hareket: Hareket) => (
        <div className="text-sm text-gray-600">
          {hareket.tur === "giris" ? (
            hareket.alinan || "-"
          ) : (
            hareket.verilen || "-"
          )}
        </div>
      ),
    },
    {
      key: "personel",
      label: "İşlemi Yapan",
      render: (hareket: Hareket) => (
        <div className="text-sm text-gray-600">
          {hareket.personel || "-"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Hareketleri</h1>
          <p className="text-sm text-gray-600 mt-1">Giriş ve çıkış işlemleri</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/envanter">
            <Button variant="outline">Stok Kartları</Button>
          </Link>
          <Button onClick={handleCreate}>Yeni Hareket</Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="İşlem Türü"
            value={tur}
            onChange={(e) => setTur(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="giris">Giriş</option>
            <option value="cikis">Çıkış</option>
          </Select>

          <Select
            label="Stok Türü"
            value={stokTuru}
            onChange={(e) => setStokTuru(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="genel">Genel</option>
            <option value="ozel">Özel</option>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline">
            Sıfırla
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam İşlem</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Giriş İşlemleri</div>
          <div className="text-2xl font-bold text-green-900">
            {hareketler.filter((h) => h.tur === "giris").length}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="text-sm text-red-700">Çıkış İşlemleri</div>
          <div className="text-2xl font-bold text-red-900">
            {hareketler.filter((h) => h.tur === "cikis").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={hareketler}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, page }))
          }
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <HareketModal
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
