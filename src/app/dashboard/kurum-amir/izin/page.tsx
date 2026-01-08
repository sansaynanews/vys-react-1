"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { IzinModal } from "./IzinModal";
import Link from "next/link";

interface AmirIzin {
  id: number;
  kurum_adi: string | null;
  amir_ad: string | null;
  baslangic: string | null;
  bitis: string | null;
  vekil_ad: string | null;
  vekil_unvan: string | null;
  vekil_tel: string | null;
  izin_turu: string | null;
  created_at: string | null;
  durum?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AmirIzinPage() {
  const [izinler, setIzinler] = useState<AmirIzin[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState<AmirIzin | null>(null);

  const { showToast } = useToastStore();

  const fetchIzinler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(durum && { durum }),
      });

      const response = await fetch(`/api/kurum-amir/izin?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "İzinler getirilemedi");
      }

      setIzinler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIzinler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchIzinler();
  };

  const handleReset = () => {
    setSearch("");
    setDurum("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchIzinler, 0);
  };

  const handleCreate = () => {
    setSelectedIzin(null);
    setModalOpen(true);
  };

  const handleEdit = (izin: AmirIzin) => {
    setSelectedIzin(izin);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedIzin(null);
    if (refresh) {
      fetchIzinler();
    }
  };

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case "devam_ediyor":
        return <Badge variant="success">Devam Ediyor</Badge>;
      case "gelecek":
        return <Badge variant="info">Gelecek</Badge>;
      case "gecmis":
        return <Badge variant="default">Tamamlandı</Badge>;
      default:
        return <Badge variant="default">Bilinmiyor</Badge>;
    }
  };

  const columns = [
    {
      key: "tarih",
      label: "İzin Tarihleri",
      render: (izin: AmirIzin) => (
        <div className="text-sm">
          <div>{izin.baslangic}</div>
          <div className="text-gray-600">{izin.bitis}</div>
        </div>
      ),
    },
    {
      key: "amir",
      label: "Amir Bilgileri",
      render: (izin: AmirIzin) => (
        <div>
          <div className="font-medium">{izin.amir_ad}</div>
          <div className="text-sm text-gray-600">{izin.kurum_adi}</div>
        </div>
      ),
    },
    {
      key: "izin_turu",
      label: "İzin Türü",
      render: (izin: AmirIzin) => izin.izin_turu || "Yıllık İzin",
    },
    {
      key: "vekil",
      label: "Vekil Bilgileri",
      render: (izin: AmirIzin) => (
        <div className="text-sm">
          {izin.vekil_ad ? (
            <>
              <div className="font-medium">{izin.vekil_ad}</div>
              {izin.vekil_unvan && <div className="text-gray-600">{izin.vekil_unvan}</div>}
              {izin.vekil_tel && <div className="text-gray-600">{izin.vekil_tel}</div>}
            </>
          ) : (
            "-"
          )}
        </div>
      ),
    },
    {
      key: "durum",
      label: "Durum",
      render: (izin: AmirIzin) => getDurumBadge(izin.durum || "gecmis"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amir İzin Takibi</h1>
          <p className="text-sm text-gray-600 mt-1">Kurum amirleri izin ve vekalet takibi</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/kurum-amir">
            <Button variant="outline">Amir Listesi</Button>
          </Link>
          <Button onClick={handleCreate}>Yeni İzin</Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ara (Kurum, Amir, Vekil)"
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
            label="Durum"
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="devam_ediyor">Devam Ediyor</option>
            <option value="gelecek">Gelecek</option>
            <option value="gecmis">Tamamlandı</option>
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
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Devam Eden İzinler</div>
          <div className="text-2xl font-bold text-green-900">
            {izinler.filter((i) => i.durum === "devam_ediyor").length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Gelecek İzinler</div>
          <div className="text-2xl font-bold text-blue-900">
            {izinler.filter((i) => i.durum === "gelecek").length}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-700">Tamamlanan</div>
          <div className="text-2xl font-bold text-gray-900">
            {izinler.filter((i) => i.durum === "gecmis").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={izinler}
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
        <IzinModal
          izin={selectedIzin}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
