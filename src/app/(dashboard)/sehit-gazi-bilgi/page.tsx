"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { SehitGaziBilgiModal } from "./SehitGaziBilgiModal";
import dayjs from "dayjs";

interface SehitGaziBilgi {
  id: number;
  tur: string | null;
  ad_soyad: string | null;
  kurum: string | null;
  medeni: string | null;
  es_ad: string | null;
  anne_ad: string | null;
  baba_ad: string | null;
  cocuk_sayisi: number | null;
  cocuk_adlari: string | null;
  olay_yeri: string | null;
  olay_tarih: string | null;
  created_at: string | null;
  foto: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SehitGaziBilgiPage() {
  const [kayitlar, setKayitlar] = useState<SehitGaziBilgi[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tur, setTur] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKayit, setSelectedKayit] = useState<SehitGaziBilgi | null>(null);

  const { showToast } = useToastStore();

  const fetchKayitlar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tur && { tur }),
      });

      const response = await fetch(`/api/sehit-gazi-bilgi?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kayıtlar getirilemedi");
      }

      setKayitlar(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKayitlar();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchKayitlar();
  };

  const handleReset = () => {
    setSearch("");
    setTur("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchKayitlar, 0);
  };

  const handleCreate = () => {
    setSelectedKayit(null);
    setModalOpen(true);
  };

  const handleEdit = (kayit: SehitGaziBilgi) => {
    setSelectedKayit(kayit);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedKayit(null);
    if (refresh) {
      fetchKayitlar();
    }
  };

  const getTurBadge = (tur: string | null) => {
    switch (tur) {
      case "Şehit":
        return <Badge variant="danger">Şehit</Badge>;
      case "Gazi":
        return <Badge variant="success">Gazi</Badge>;
      default:
        return <Badge variant="default">{tur || "-"}</Badge>;
    }
  };

  const columns = [
    {
      key: "tur",
      label: "Tür",
      render: (kayit: SehitGaziBilgi) => getTurBadge(kayit.tur),
    },
    {
      key: "ad_soyad",
      label: "Ad Soyad",
      render: (kayit: SehitGaziBilgi) => (
        <div>
          <div className="font-medium">{kayit.ad_soyad || "-"}</div>
          {kayit.kurum && <div className="text-xs text-gray-600">{kayit.kurum}</div>}
        </div>
      ),
    },
    {
      key: "olay",
      label: "Olay Bilgisi",
      render: (kayit: SehitGaziBilgi) => (
        <div className="text-sm">
          <div>{kayit.olay_yeri || "-"}</div>
          {kayit.olay_tarih && (
            <div className="text-gray-600">
              {dayjs(kayit.olay_tarih).format("DD.MM.YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "aile",
      label: "Aile Bilgisi",
      render: (kayit: SehitGaziBilgi) => (
        <div className="text-sm">
          {kayit.medeni && <div className="text-gray-600">Medeni: {kayit.medeni}</div>}
          {kayit.cocuk_sayisi !== null && (
            <div className="text-gray-600">Çocuk: {kayit.cocuk_sayisi}</div>
          )}
        </div>
      ),
    },
    {
      key: "ebeveyn",
      label: "Anne/Baba",
      render: (kayit: SehitGaziBilgi) => (
        <div className="text-sm text-gray-600">
          {kayit.anne_ad && <div>Anne: {kayit.anne_ad}</div>}
          {kayit.baba_ad && <div>Baba: {kayit.baba_ad}</div>}
        </div>
      ),
    },
  ];

  const turler = ["Şehit", "Gazi"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şehit/Gazi Bilgileri</h1>
          <p className="text-sm text-gray-600 mt-1">Şehit ve gazi bilgi kayıtları</p>
        </div>
        <Button onClick={handleCreate}>Yeni Kayıt</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ara (Ad Soyad, Kurum, Olay Yeri)"
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
            label="Tür"
            value={tur}
            onChange={(e) => setTur(e.target.value)}
          >
            <option value="">Tüm Türler</option>
            {turler.map((t) => (
              <option key={t} value={t}>
                {t}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Kayıt</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="text-sm text-red-700">Şehit</div>
          <div className="text-2xl font-bold text-red-900">
            {kayitlar.filter((k) => k.tur === "Şehit").length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Gazi</div>
          <div className="text-2xl font-bold text-green-900">
            {kayitlar.filter((k) => k.tur === "Gazi").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={kayitlar}
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
        <SehitGaziBilgiModal
          kayit={selectedKayit}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
