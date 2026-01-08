"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { DateInput } from "@/components/ui/DateInput";
import RandevuModal from "./RandevuModal";
import dayjs from "dayjs";
import "dayjs/locale/tr";

dayjs.locale("tr");

interface Randevu {
  id: number;
  ad_soyad: string | null;
  kurum: string | null;
  unvan: string | null;
  telefon: string | null;
  konu: string | null;
  tarih: string | null;
  saat: string | null;
  durum: string | null;
  notlar: string | null;
  salon: string | null;
  created_at: string | null;
}

export default function RandevuPage() {
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRandevu, setSelectedRandevu] = useState<Randevu | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterTarih, setFilterTarih] = useState("");
  const [filterDurum, setFilterDurum] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchRandevular();
  }, [currentPage, search, filterTarih, filterDurum]);

  const fetchRandevular = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (search) params.append("search", search);
      if (filterTarih) params.append("tarih", filterTarih);
      if (filterDurum) params.append("durum", filterDurum);

      const response = await fetch(`/api/randevu?${params}`);
      const data = await response.json();

      if (data.data) {
        setRandevular(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      }
    } catch (error) {
      console.error("Randevular getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (randevu: Randevu) => {
    setSelectedRandevu(randevu);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRandevu(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRandevu(null);
  };

  const handleSuccess = () => {
    fetchRandevular();
    handleModalClose();
  };

  const getDurumBadge = (durum: string | null) => {
    const durumText = durum || "Bekliyor";
    const variants: Record<string, "success" | "warning" | "danger" | "info"> = {
      "Tamamlandı": "success",
      "Görüşüldü": "success",
      "Onaylandı": "info",
      "Bekliyor": "warning",
      "İptal": "danger",
    };

    return (
      <Badge variant={variants[durumText] || "info"}>
        {durumText}
      </Badge>
    );
  };

  const columns: Column<Randevu>[] = [
    {
      key: "tarih",
      header: "Tarih",
      render: (item) =>
        item.tarih ? dayjs(item.tarih).format("DD.MM.YYYY") : "-",
    },
    {
      key: "saat",
      header: "Saat",
      render: (item) => item.saat || "-",
    },
    {
      key: "ad_soyad",
      header: "Ad Soyad",
      render: (item) => (
        <div>
          <div className="font-medium text-slate-900">{item.ad_soyad}</div>
          {item.unvan && (
            <div className="text-xs text-slate-500">{item.unvan}</div>
          )}
        </div>
      ),
    },
    {
      key: "kurum",
      header: "Kurum",
      render: (item) => item.kurum || "-",
    },
    {
      key: "konu",
      header: "Konu",
      render: (item) => (
        <div className="max-w-xs truncate" title={item.konu || ""}>
          {item.konu || "-"}
        </div>
      ),
    },
    {
      key: "durum",
      header: "Durum",
      render: (item) => getDurumBadge(item.durum),
    },
    {
      key: "actions",
      header: "İşlemler",
      render: (item) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEdit(item)}
        >
          Düzenle
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Makam Randevu
            </h1>
            <p className="text-sm text-slate-600">
              Randevu kayıtlarını görüntüleyin ve yönetin
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-5 h-5" />
          Yeni Randevu
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Ad, kurum veya konu ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <DateInput
            value={filterTarih}
            onChange={(e) => {
              setFilterTarih(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tarih filtrele"
          />
          <Select
            value={filterDurum}
            onChange={(e) => {
              setFilterDurum(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: "Bekliyor", label: "Bekliyor" },
              { value: "Onaylandı", label: "Onaylandı" },
              { value: "Tamamlandı", label: "Tamamlandı" },
              { value: "Görüşüldü", label: "Görüşüldü" },
              { value: "İptal", label: "İptal" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : (
        <DataTable
          data={randevular}
          columns={columns}
          loading={loading}
          emptyMessage="Henüz randevu kaydı bulunmuyor"
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            pageSize,
            totalItems,
          }}
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <RandevuModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          randevu={selectedRandevu}
        />
      )}
    </div>
  );
}
