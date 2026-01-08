"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { SehitGaziZiyaretModal } from "./SehitGaziZiyaretModal";
import dayjs from "dayjs";

interface SehitGaziZiyaret {
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
  ziyaret_tarih: string | null;
  ziyaret_saat: string | null;
  talepler: string | null;
  created_at: string | null;
  aile_ferdi: string | null;
  saat: any;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SehitGaziZiyaretPage() {
  const [ziyaretler, setZiyaretler] = useState<SehitGaziZiyaret[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tur, setTur] = useState("");
  const [tarih, setTarih] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedZiyaret, setSelectedZiyaret] = useState<SehitGaziZiyaret | null>(null);

  const { showToast } = useToastStore();

  const fetchZiyaretler = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tur && { tur }),
        ...(tarih && { tarih }),
      });

      const response = await fetch(`/api/sehit-gazi-ziyaret?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ziyaretler getirilemedi");
      }

      setZiyaretler(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZiyaretler();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchZiyaretler();
  };

  const handleReset = () => {
    setSearch("");
    setTur("");
    setTarih("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchZiyaretler, 0);
  };

  const handleCreate = () => {
    setSelectedZiyaret(null);
    setModalOpen(true);
  };

  const handleEdit = (ziyaret: SehitGaziZiyaret) => {
    setSelectedZiyaret(ziyaret);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedZiyaret(null);
    if (refresh) {
      fetchZiyaretler();
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
      render: (ziyaret: SehitGaziZiyaret) => getTurBadge(ziyaret.tur),
    },
    {
      key: "ad_soyad",
      label: "Ad Soyad",
      render: (ziyaret: SehitGaziZiyaret) => (
        <div>
          <div className="font-medium">{ziyaret.ad_soyad || "-"}</div>
          {ziyaret.kurum && <div className="text-xs text-gray-600">{ziyaret.kurum}</div>}
        </div>
      ),
    },
    {
      key: "olay",
      label: "Olay Bilgisi",
      render: (ziyaret: SehitGaziZiyaret) => (
        <div className="text-sm">
          <div>{ziyaret.olay_yeri || "-"}</div>
          {ziyaret.olay_tarih && (
            <div className="text-gray-600">
              {dayjs(ziyaret.olay_tarih).format("DD.MM.YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "ziyaret",
      label: "Ziyaret Tarihi",
      render: (ziyaret: SehitGaziZiyaret) => (
        <div className="text-sm">
          {ziyaret.ziyaret_tarih ? (
            <>
              <div>{dayjs(ziyaret.ziyaret_tarih).format("DD.MM.YYYY")}</div>
              {ziyaret.ziyaret_saat && (
                <div className="text-gray-600">{ziyaret.ziyaret_saat}</div>
              )}
            </>
          ) : (
            "-"
          )}
        </div>
      ),
    },
    {
      key: "aile",
      label: "Aile Bilgisi",
      render: (ziyaret: SehitGaziZiyaret) => (
        <div className="text-sm text-gray-600">
          {ziyaret.medeni && <div>Medeni: {ziyaret.medeni}</div>}
          {ziyaret.cocuk_sayisi !== null && <div>Çocuk: {ziyaret.cocuk_sayisi}</div>}
        </div>
      ),
    },
  ];

  const turler = ["Şehit", "Gazi"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Şehit/Gazi Ziyaretleri</h1>
          <p className="text-sm text-gray-600 mt-1">Şehit ve gazi ailelerine yapılan ziyaret kayıtları</p>
        </div>
        <Button onClick={handleCreate}>Yeni Ziyaret Kaydı</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Input
            label="Ziyaret Tarihi"
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Ziyaret</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="text-sm text-red-700">Şehit Ailesi</div>
          <div className="text-2xl font-bold text-red-900">
            {ziyaretler.filter((z) => z.tur === "Şehit").length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Gazi</div>
          <div className="text-2xl font-bold text-green-900">
            {ziyaretler.filter((z) => z.tur === "Gazi").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={ziyaretler}
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
        <SehitGaziZiyaretModal
          ziyaret={selectedZiyaret}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
