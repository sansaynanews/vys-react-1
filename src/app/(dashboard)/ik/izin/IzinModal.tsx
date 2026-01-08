"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import dayjs from "dayjs";

interface Izin {
  id: number;
  personel_id: number;
  personel_ad: string | null;
  personel_birim: string | null;
  turu: string | null;
  baslangic: string | null;
  bitis: string | null;
  mesai_tarihi?: string | null;
  mesai_saati?: string | null;
  aciklama: string | null;
}

interface IzinModalProps {
  izin: Izin | null;
  onClose: (refresh?: boolean) => void;
}

interface Personel {
  id: number;
  ad_soyad: string;
  birim: string;
  toplam_izin: number;
  kullanilan_izin: number;
}

export function IzinModal({ izin, onClose }: IzinModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personeller, setPersoneller] = useState<Personel[]>([]);
  const [selectedPersonel, setSelectedPersonel] = useState<Personel | null>(null);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    personel_id: "",
    turu: "Yıllık İzin",
    baslangic: "",
    bitis: "",
    mesai_tarihi: "",
    mesai_saati: "",
    aciklama: "",
  });

  useEffect(() => {
    fetchPersoneller();
  }, []);

  useEffect(() => {
    if (izin) {
      setFormData({
        personel_id: izin.personel_id.toString(),
        turu: izin.turu || "Yıllık İzin",
        baslangic: izin.baslangic || "",
        bitis: izin.bitis || "",
        mesai_tarihi: izin.mesai_tarihi || "",
        mesai_saati: izin.mesai_saati || "",
        aciklama: izin.aciklama || "",
      });
      // Personel bilgisini bul
      fetchPersonelDetail(izin.personel_id);
    }
  }, [izin, personeller]);

  const fetchPersoneller = async () => {
    try {
      const response = await fetch("/api/personel?limit=1000&durum=aktif");
      const data = await response.json();
      if (response.ok) {
        setPersoneller(data.data);
      }
    } catch (error) {
      console.error("Personel listesi alınamadı:", error);
    }
  };

  const fetchPersonelDetail = async (personelId: number) => {
    try {
      const response = await fetch(`/api/personel/${personelId}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedPersonel(data.data);
      }
    } catch (error) {
      console.error("Personel detayı alınamadı:", error);
    }
  };

  const handlePersonelChange = (personelId: string) => {
    setFormData({ ...formData, personel_id: personelId });
    const personel = personeller.find((p) => p.id === parseInt(personelId));
    setSelectedPersonel(personel || null);
  };

  const calculateGunSayisi = () => {
    if (!formData.baslangic || !formData.bitis) return 0;
    const baslangic = dayjs(formData.baslangic);
    const bitis = dayjs(formData.bitis);
    return bitis.diff(baslangic, "day") + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.personel_id) {
        throw new Error("Personel seçiniz");
      }

      const gunSayisi = calculateGunSayisi();
      if (gunSayisi <= 0) {
        throw new Error("Geçerli bir tarih aralığı giriniz");
      }

      const payload = {
        personel_id: parseInt(formData.personel_id),
        turu: formData.turu,
        baslangic: formData.baslangic,
        bitis: formData.bitis,
        mesai_tarihi: formData.mesai_tarihi || undefined,
        mesai_saati: formData.mesai_saati || undefined,
        aciklama: formData.aciklama || undefined,
      };

      const url = izin ? `/api/personel/izin/${izin.id}` : "/api/personel/izin";
      const method = izin ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "İşlem başarısız");
      }

      showToast(data.message, "success");
      onClose(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!izin) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/personel/izin/${izin.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Silme başarısız");
      }

      showToast(data.message, "success");
      onClose(true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const gunSayisi = calculateGunSayisi();
  const kalanIzin = selectedPersonel
    ? (selectedPersonel.toplam_izin || 14) - (selectedPersonel.kullanilan_izin || 0)
    : 0;

  return (
    <>
      <Modal open={true} onClose={() => onClose()} title={izin ? "İzin Kaydı Düzenle" : "Yeni İzin Kaydı"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Personel Seçimi */}
            <Select
              label="Personel"
              required
              value={formData.personel_id}
              onChange={(e) => handlePersonelChange(e.target.value)}
              disabled={!!izin}
            >
              <option value="">Seçiniz</option>
              {personeller.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.ad_soyad} - {p.birim}
                </option>
              ))}
            </Select>

            {/* Personel İzin Bilgisi */}
            {selectedPersonel && formData.turu === "Yıllık İzin" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">İzin Durumu</div>
                  <div className="text-blue-800 space-y-1">
                    <div>Toplam: <span className="font-medium">{selectedPersonel.toplam_izin || 14} gün</span></div>
                    <div>Kullanılan: <span className="font-medium">{selectedPersonel.kullanilan_izin || 0} gün</span></div>
                    <div>Kalan: <span className="font-medium text-green-700">{kalanIzin} gün</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* İzin Türü */}
            <Select
              label="İzin Türü"
              required
              value={formData.turu}
              onChange={(e) => setFormData({ ...formData, turu: e.target.value })}
            >
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

            {/* Tarih Aralığı */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                label="Başlangıç Tarihi"
                required
                value={formData.baslangic}
                onChange={(e) => setFormData({ ...formData, baslangic: e.target.value })}
              />
              <DateInput
                label="Bitiş Tarihi"
                required
                value={formData.bitis}
                onChange={(e) => setFormData({ ...formData, bitis: e.target.value })}
              />
            </div>

            {/* Gün Sayısı Gösterimi */}
            {gunSayisi > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm">
                  <span className="text-gray-700">İzin Süresi: </span>
                  <span className="font-medium text-gray-900">{gunSayisi} gün</span>
                  {formData.turu === "Yıllık İzin" && selectedPersonel && (
                    <>
                      {gunSayisi > kalanIzin ? (
                        <span className="ml-2 text-red-600">
                          (Yetersiz izin hakkı!)
                        </span>
                      ) : (
                        <span className="ml-2 text-green-600">
                          (İşlem sonrası kalan: {kalanIzin - gunSayisi} gün)
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mesai Karşılığı */}
            {formData.turu === "Mazeret İzni" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-3">
                <div className="text-sm font-medium text-yellow-900">
                  Mesai Karşılığı Bilgileri (Opsiyonel)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateInput
                    label="Mesai Tarihi"
                    value={formData.mesai_tarihi}
                    onChange={(e) => setFormData({ ...formData, mesai_tarihi: e.target.value })}
                  />
                  <Input
                    label="Mesai Saati"
                    value={formData.mesai_saati}
                    onChange={(e) => setFormData({ ...formData, mesai_saati: e.target.value })}
                    placeholder="örn: 14:00-18:00"
                  />
                </div>
              </div>
            )}

            {/* Açıklama */}
            <Textarea
              label="Açıklama"
              value={formData.aciklama}
              onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
              placeholder="İzin nedeni ve detaylar..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {izin ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={loading}
              >
                Sil
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onClose()} disabled={loading}>
                İptal
              </Button>
              <Button type="submit" loading={loading}>
                {izin ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="İzin Kaydını Sil"
        message={`${izin?.personel_ad} - ${izin?.turu} kaydını silmek istediğinizden emin misiniz? Yıllık izin ise kullanılan izin hakkı geri verilecektir.`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
