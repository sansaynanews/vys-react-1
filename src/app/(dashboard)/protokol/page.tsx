"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/ui/DataTable";
import { useToastStore } from "@/hooks/useToastStore";
import { ProtokolModal } from "./ProtokolModal";

interface Protokol {
  id: number;
  sira_no: number | null;
  ad_soyad: string | null;
  unvan: string | null;
  kurum: string | null;
  telefon: string | null;
  eposta: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProtokolPage() {
  const [protokoller, setProtokoller] = useState<Protokol[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProtokol, setSelectedProtokol] = useState<Protokol | null>(null);

  const { showToast } = useToastStore();

  const fetchProtokoller = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/protokol?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Protokol listesi getirilemedi");
      }

      setProtokoller(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtokoller();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProtokoller();
  };

  const handleReset = () => {
    setSearch("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchProtokoller, 0);
  };

  const handleCreate = () => {
    setSelectedProtokol(null);
    setModalOpen(true);
  };

  const handleEdit = (protokol: Protokol) => {
    setSelectedProtokol(protokol);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedProtokol(null);
    if (refresh) {
      fetchProtokoller();
    }
  };

  const columns = [
    {
      key: "sira_no",
      label: "Sıra",
      render: (protokol: Protokol) => protokol.sira_no || "-",
    },
    {
      key: "ad_soyad",
      label: "Ad Soyad",
      render: (protokol: Protokol) => (
        <div>
          <div className="font-medium">{protokol.ad_soyad}</div>
          <div className="text-sm text-gray-600">{protokol.unvan}</div>
        </div>
      ),
    },
    {
      key: "kurum",
      label: "Kurum",
      render: (protokol: Protokol) => protokol.kurum || "-",
    },
    {
      key: "iletisim",
      label: "İletişim",
      render: (protokol: Protokol) => (
        <div className="text-sm">
          {protokol.telefon && <div className="text-gray-900">{protokol.telefon}</div>}
          {protokol.eposta && <div className="text-gray-600">{protokol.eposta}</div>}
          {!protokol.telefon && !protokol.eposta && "-"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Protokol Listesi</h1>
          <p className="text-sm text-gray-600 mt-1">Protokol sırasına göre kişiler</p>
        </div>
        <Button onClick={handleCreate}>Yeni Protokol</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ara (Ad Soyad, Ünvan, Kurum)"
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
          <div className="text-sm text-gray-600">Toplam Protokol</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Toplam Kurum</div>
          <div className="text-2xl font-bold text-blue-900">
            {new Set(protokoller.map((p) => p.kurum).filter((k) => k)).size}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={protokoller}
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
        <ProtokolModal
          protokol={selectedProtokol}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
