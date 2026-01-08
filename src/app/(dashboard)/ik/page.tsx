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
          <div className="font-medium">{personel.ad_soyad}</div>
          {personel.unvan && (
            <div className="text-sm text-gray-600">{personel.unvan}</div>
          )}
        </div>
      ),
    },
    {
      key: "birim",
      label: "Birim",
      render: (personel: Personel) => personel.birim,
    },
    {
      key: "iletisim",
      label: "İletişim",
      render: (personel: Personel) => (
        <div className="text-sm">
          {personel.telefon && <div>{personel.telefon}</div>}
          {personel.eposta && <div className="text-gray-600">{personel.eposta}</div>}
        </div>
      ),
    },
    {
      key: "baslama_tarihi",
      label: "Başlama Tarihi",
      render: (personel: Personel) => personel.baslama_tarihi || "-",
    },
    {
      key: "izin",
      label: "İzin Durumu",
      render: (personel: Personel) => {
        const toplam = personel.toplam_izin || 14;
        const kullanilan = personel.kullanilan_izin || 0;
        const kalan = toplam - kullanilan;
        return (
          <div className="text-sm">
            <div>Kalan: <span className="font-medium">{kalan}</span> gün</div>
            <div className="text-gray-600">Kullanılan: {kullanilan}/{toplam}</div>
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
          <span className="text-gray-400">-</span>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Personel Yönetimi</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/ik/izin">
            <Button variant="outline">İzin Yönetimi</Button>
          </Link>
          <Button onClick={handleCreate}>Yeni Personel</Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Ara (Ad, Ünvan, Tel, E-posta)"
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
            label="Birim"
            value={birim}
            onChange={(e) => setBirim(e.target.value)}
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
          >
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
            <option value="">Tümü</option>
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

      {/* Tablo */}
      <div className="bg-white rounded-lg shadow">
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
