"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/hooks/useToastStore";
import { PersonelModal } from "./PersonelModal";
import Link from "next/link";
import { Sparkles, UserCheck, Plus, FileSpreadsheet } from "lucide-react";

interface Personel {
  id: number;
  birim: string;
  ad_soyad: string;
  unvan: string | null;
  telefon: string | null;
  eposta: string | null;
  baslama_tarihi: string | null;
  toplam_izin: number | null;
  kullanilan_izin: number | null;
  mesai_saati: number | null;
  silindi: boolean | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function PersonelPage() {
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [birim, setBirim] = useState("");
  const [durum, setDurum] = useState("aktif");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPersonel, setSelectedPersonel] = useState<Personel | null>(null);

  const { showToast } = useToastStore();

  const fetchPersoneller = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        durum,
        ...(search && { search }),
        ...(birim && { birim }),
      });

      const response = await fetch(`/api/personel?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Personeller getirilemedi");
      }

      setPersoneller(data.data);
      setPagination(data.pagination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersoneller();
  }, [pagination.page, pagination.limit, durum]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPersoneller();
  };

  const handleReset = () => {
    setSearch("");
    setBirim("");
    setDurum("aktif");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchPersoneller, 0);
  };

  const handleCreate = () => {
    setSelectedPersonel(null);
    setModalOpen(true);
  };

  const handleEdit = (personel: Personel) => {
    setSelectedPersonel(personel);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedPersonel(null);
    if (refresh) {
      fetchPersoneller();
    }
  };

  const columns = [
    {
      key: "ad_soyad",
      label: "Ad Soyad",
      render: (personel: Personel) => (
        <div>
          <div className="font-medium text-slate-800">{personel.ad_soyad}</div>
          {personel.unvan && (
            <div className="text-xs text-slate-500">{personel.unvan}</div>
          )}
        </div>
      ),
    },
    {
      key: "birim",
      label: "Birim",
      render: (personel: Personel) => <span className="text-sm text-slate-600">{personel.birim}</span>,
    },
    {
      key: "iletisim",
      label: "İletişim",
      render: (personel: Personel) => (
        <div className="text-xs">
          {personel.telefon && <div>{personel.telefon}</div>}
          {personel.eposta && <div className="text-slate-500">{personel.eposta}</div>}
        </div>
      ),
    },
    {
      key: "baslama_tarihi",
      label: "Başlama Tarihi",
      render: (personel: Personel) => <span className="text-sm">{personel.baslama_tarihi || "-"}</span>,
    },
    {
      key: "izin",
      label: "İzin Durumu",
      render: (personel: Personel) => {
        const toplam = personel.toplam_izin || 14;
        const kullanilan = personel.kullanilan_izin || 0;
        const kalan = toplam - kullanilan;
        return (
          <div className="text-xs">
            <div>Kalan: <span className="font-bold text-emerald-600">{kalan}</span> gün</div>
            <div className="text-slate-400">Kul: {kullanilan}/{toplam}</div>
          </div>
        );
      },
    },
    {
      key: "mesai",
      label: "Mesai",
      render: (personel: Personel) => {
        const mesai = personel.mesai_saati || 0;
        return mesai > 0 ? (
          <Badge variant="info">{mesai.toFixed(1)} saat</Badge>
        ) : (
          <span className="text-slate-300">-</span>
        );
      },
    },
    {
      key: "durum",
      label: "Durum",
      render: (personel: Personel) => (
        personel.silindi ? (
          <Badge variant="danger">Pasif</Badge>
        ) : (
          <Badge variant="success">Aktif</Badge>
        )
      ),
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 animate-gradient-x rounded-2xl p-6 shadow-2xl border border-white/5">

        {/* Header Content */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-white/80">İnsan Kaynakları</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Personel Yönetimi</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Personel listesi, izin takibi ve özlük işlemleri.
            </p>
          </div>

          {/* Actions */}
          <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm gap-2">
            <Link href="/dashboard/ik/izin" className="hidden sm:inline-flex">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                İzin Yönetimi
              </Button>
            </Link>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-none">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Personel
            </Button>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">

        {/* Filtreler */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, Ünvan, Tel..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-white"
            />

            <Select
              label="Birim"
              value={birim}
              onChange={(e) => setBirim(e.target.value)}
              className="bg-white"
            >
              <option value="">Tümü</option>
              <option value="Özel Kalem">Özel Kalem</option>
              <option value="Strateji Geliştirme">Strateji Geliştirme</option>
              <option value="İnsan Kaynakları">İnsan Kaynakları</option>
              <option value="Hukuk">Hukuk</option>
              <option value="Mali Hizmetler">Mali Hizmetler</option>
              <option value="Basın ve Halkla İlişkiler">Basın ve Halkla İlişkiler</option>
              <option value="Bilgi İşlem">Bilgi İşlem</option>
              <option value="Destek Hizmetleri">Destek Hizmetleri</option>
            </Select>

            <Select
              label="Durum"
              value={durum}
              onChange={(e) => setDurum(e.target.value)}
              className="bg-white"
            >
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
              <option value="">Tümü</option>
            </Select>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} variant="primary" className="flex-1">Ara</Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">Sıfırla</Button>
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <DataTable
            data={personeller}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onRowClick={handleEdit}
          />
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <PersonelModal
          personel={selectedPersonel}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
