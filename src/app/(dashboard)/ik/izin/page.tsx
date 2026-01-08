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

interface Izin {
  id: number;
  personel_id: number;
  personel_ad: string | null;
  personel_birim: string | null;
  turu: string | null;
  baslangic: string | null;
  bitis: string | null;
  gunSayisi: number;
  durum: string;
  aciklama: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function IzinPage() {
  const [izinler, setIzinler] = useState<Izin[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [turu, setTuru] = useState("");
  const [durum, setDurum] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState<Izin | null>(null);

  const { showToast } = useToastStore();

  const fetchIzinler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(turu && { turu }),
        ...(durum && { durum }),
      });

      const response = await fetch(`/api/personel/izin?${params}`);
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
  }, [pagination.page, pagination.limit, durum]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchIzinler();
  };

  const handleReset = () => {
    setTuru("");
    setDurum("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchIzinler, 0);
  };

  const handleCreate = () => {
    setSelectedIzin(null);
    setModalOpen(true);
  };

  const handleEdit = (izin: Izin) => {
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
      case "aktif":
        return <Badge variant="success">Devam Ediyor</Badge>;
      case "gelecek":
        return <Badge variant="info">Gelecek</Badge>;
      case "gecmis":
        return <Badge variant="default">Tamamlandı</Badge>;
      default:
        return <Badge variant="default">{durum}</Badge>;
    }
  };

  const columns = [
    {
      key: "personel",
      label: "Personel",
      render: (izin: Izin) => (
        <div>
          <div className="font-medium">{izin.personel_ad}</div>
          {izin.personel_birim && (
            <div className="text-sm text-gray-600">{izin.personel_birim}</div>
          )}
        </div>
      ),
    },
    {
      key: "turu",
      label: "İzin Türü",
      render: (izin: Izin) => izin.turu || "-",
    },
    {
      key: "tarih",
      label: "Tarih Aralığı",
      render: (izin: Izin) => (
        <div className="text-sm">
          <div>{izin.baslangic} - {izin.bitis}</div>
          <div className="text-gray-600">{izin.gunSayisi} gün</div>
        </div>
      ),
    },
    {
      key: "durum",
      label: "Durum",
      render: (izin: Izin) => getDurumBadge(izin.durum),
    },
    {
      key: "aciklama",
      label: "Açıklama",
      render: (izin: Izin) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {izin.aciklama || "-"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İzin Yönetimi</h1>
          <p className="text-sm text-gray-600 mt-1">Personel izin takibi ve yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ik">
            <Button variant="outline">Personel Listesi</Button>
          </Link>
          <Button onClick={handleCreate}>Yeni İzin Kaydı</Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="İzin Türü"
            value={turu}
            onChange={(e) => setTuru(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Yıllık İzin">Yıllık İzin</option>
            <option value="Mazeret İzni">Mazeret İzni</option>
            <option value="Hastalık İzni">Hastalık İzni</option>
            <option value="Rapor">Rapor</option>
            <option value="Ücretsiz İzin">Ücretsiz İzin</option>
            <option value="Doğum İzni">Doğum İzni</option>
            <option value="Babalık İzni">Babalık İzni</option>
            <option value="Ölüm İzni">Ölüm İzni</option>
            <option value="Evlilik İzni">Evlilik İzni</option>
          </Select>

          <Select
            label="Durum"
            value={durum}
            onChange={(e) => setDurum(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="aktif">Devam Ediyor</option>
            <option value="gelecek">Gelecek</option>
            <option value="gecmis">Tamamlanmış</option>
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
          <div className="text-sm text-gray-600">Toplam İzin</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Devam Eden</div>
          <div className="text-2xl font-bold text-green-900">
            {izinler.filter((i) => i.durum === "aktif").length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Gelecek</div>
          <div className="text-2xl font-bold text-blue-900">
            {izinler.filter((i) => i.durum === "gelecek").length}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600">Tamamlanmış</div>
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
