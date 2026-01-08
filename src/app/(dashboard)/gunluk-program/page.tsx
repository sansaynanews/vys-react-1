"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { GunlukProgramModal } from "./GunlukProgramModal";
import dayjs from "dayjs";

interface GunlukProgram {
  id: number;
  tarih: string;
  saat: string;
  tur: string | null;
  aciklama: string | null;
  created_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function GunlukProgramPage() {
  const [programlar, setProgramlar] = useState<GunlukProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [tarih, setTarih] = useState("");
  const [tur, setTur] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<GunlukProgram | null>(null);

  const { showToast } = useToastStore();

  const fetchProgramlar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tarih && { tarih }),
        ...(tur && { tur }),
      });

      const response = await fetch(`/api/gunluk-program?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Günlük program getirilemedi");
      }

      setProgramlar(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramlar();
  }, [pagination.page, pagination.limit]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProgramlar();
  };

  const handleReset = () => {
    setSearch("");
    setTarih("");
    setTur("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchProgramlar, 0);
  };

  const handleCreate = () => {
    setSelectedProgram(null);
    setModalOpen(true);
  };

  const handleEdit = (program: GunlukProgram) => {
    setSelectedProgram(program);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedProgram(null);
    if (refresh) {
      fetchProgramlar();
    }
  };

  const getTurBadge = (tur: string | null) => {
    if (!tur) return <Badge variant="default">-</Badge>;

    const badges: Record<string, { variant: "default" | "success" | "danger" | "warning" | "info" }> = {
      "Toplantı": { variant: "info" },
      "Ziyaret": { variant: "success" },
      "Etkinlik": { variant: "warning" },
      "Randevu": { variant: "default" },
    };

    const badge = badges[tur] || { variant: "default" as const };
    return <Badge variant={badge.variant}>{tur}</Badge>;
  };

  const columns = [
    {
      key: "tarih",
      label: "Tarih",
      render: (program: GunlukProgram) => (
        <div className="font-medium">
          {dayjs(program.tarih).format("DD.MM.YYYY")}
        </div>
      ),
    },
    {
      key: "saat",
      label: "Saat",
      render: (program: GunlukProgram) => (
        <div className="text-sm">{program.saat}</div>
      ),
    },
    {
      key: "tur",
      label: "Tür",
      render: (program: GunlukProgram) => getTurBadge(program.tur),
    },
    {
      key: "aciklama",
      label: "Açıklama",
      render: (program: GunlukProgram) => (
        <div className="text-sm text-gray-600 max-w-md truncate">
          {program.aciklama || "-"}
        </div>
      ),
    },
  ];

  const turler = ["Toplantı", "Ziyaret", "Etkinlik", "Randevu"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Günlük Program</h1>
          <p className="text-sm text-gray-600 mt-1">Manuel günlük program takibi</p>
        </div>
        <Button onClick={handleCreate}>Yeni Program Ekle</Button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Ara (Açıklama, Tür)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Arama..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <Input
            label="Tarih"
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Toplam Program</div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
          <div className="text-sm text-blue-700">Bugün</div>
          <div className="text-2xl font-bold text-blue-900">
            {programlar.filter((p) => p.tarih === dayjs().format("YYYY-MM-DD")).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
          <div className="text-sm text-green-700">Bu Hafta</div>
          <div className="text-2xl font-bold text-green-900">
            {programlar.filter((p) => {
              const pTarih = dayjs(p.tarih);
              return pTarih.isAfter(dayjs().startOf("week")) && pTarih.isBefore(dayjs().endOf("week"));
            }).length}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
          <div className="text-sm text-purple-700">Toplantı</div>
          <div className="text-2xl font-bold text-purple-900">
            {programlar.filter((p) => p.tur === "Toplantı").length}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={programlar}
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
        <GunlukProgramModal
          program={selectedProgram}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
