"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/ui/DataTable";
import { useToastStore } from "@/hooks/useToastStore";
import { AmirModal } from "./AmirModal";
import Link from "next/link";

interface KurumAmir {
  id: number;
  kurum_adi: string;
  ad_soyad: string;
  unvan: string | null;
  email: string | null;
  gsm: string | null;
  sabit_tel: string | null;
  foto: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function KurumAmirPage() {
  const [amirler, setAmirler] = useState<KurumAmir[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAmir, setSelectedAmir] = useState<KurumAmir | null>(null);

  const { showToast } = useToastStore();

  const fetchAmirler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/kurum-amir?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kurum amirleri getirilemedi");
      }

      setAmirler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmirler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAmirler();
  };

  const handleReset = () => {
    setSearch("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchAmirler, 0);
  };

  const handleCreate = () => {
    setSelectedAmir(null);
    setModalOpen(true);
  };

  const handleEdit = (amir: KurumAmir) => {
    setSelectedAmir(amir);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedAmir(null);
    if (refresh) {
      fetchAmirler();
    }
  };

  const columns = [
    {
      key: "kurum_adi",
      label: "Kurum",
      render: (amir: KurumAmir) => (
        <div>
          <div className="font-medium">{amir.kurum_adi}</div>
          <div className="text-sm text-gray-600">{amir.ad_soyad}</div>
        </div>
      ),
    },
    {
      key: "unvan",
      label: "Ünvan",
      render: (amir: KurumAmir) => amir.unvan || "-",
    },
    {
      key: "iletisim",
      label: "İletişim",
      render: (amir: KurumAmir) => (
        <div className="text-sm">
          {amir.gsm && <div className="text-gray-900">{amir.gsm}</div>}
          {amir.email && <div className="text-gray-600">{amir.email}</div>}
          {!amir.gsm && !amir.email && "-"}
        </div>
      ),
    },
    {
      key: "sabit_tel",
      label: "Sabit Tel",
      render: (amir: KurumAmir) => amir.sabit_tel || "-",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kurum Amirleri</h1>
          <p className="text-sm text-gray-600 mt-1">Kurum amirleri ve izin takibi</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/kurum-amir/izin">
            <Button variant="outline">İzin Takibi</Button>
          </Link>
          <Button onClick={handleCreate}>Yeni Amir</Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ara (Kurum, Ad Soyad, Ünvan)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Arama..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Kurum Amiri</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Toplam Kurum</div>
          <div className="text-2xl font-bold text-blue-900">
            {new Set(amirler.map((a) => a.kurum_adi)).size}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={amirler}
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
        <AmirModal
          amir={selectedAmir}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
