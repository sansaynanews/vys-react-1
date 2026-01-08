"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface UstDuzeyZiyaret {
  id: number;
  protokol_turu: string | null;
  ad_soyad: string | null;
  gelis_tarihi: string | null;
  gelis_saati: string | null;
  karsilama_yeri: string | null;
  konaklama_yeri: string | null;
  notlar: string | null;
}

interface UstDuzeyZiyaretModalProps {
  ziyaret: UstDuzeyZiyaret | null;
  onClose: (refresh?: boolean) => void;
}

export function UstDuzeyZiyaretModal({ ziyaret, onClose }: UstDuzeyZiyaretModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    protokol_turu: "Bakan",
    ad_soyad: "",
    gelis_tarihi: "",
    gelis_saati: "",
    karsilama_yeri: "",
    konaklama_yeri: "",
    notlar: "",
  });

  useEffect(() => {
    if (ziyaret) {
      setFormData({
        protokol_turu: ziyaret.protokol_turu || "Bakan",
        ad_soyad: ziyaret.ad_soyad || "",
        gelis_tarihi: ziyaret.gelis_tarihi || "",
        gelis_saati: ziyaret.gelis_saati || "",
        karsilama_yeri: ziyaret.karsilama_yeri || "",
        konaklama_yeri: ziyaret.konaklama_yeri || "",
        notlar: ziyaret.notlar || "",
      });
    }
  }, [ziyaret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = ziyaret ? `/api/ust-duzey-ziyaret/${ziyaret.id}` : "/api/ust-duzey-ziyaret";
      const method = ziyaret ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
    if (!ziyaret) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/ust-duzey-ziyaret/${ziyaret.id}`, {
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

  const protokolTurleri = [
    "Bakan",
    "Vali",
    "Milletvekili",
    "Genel Müdür",
    "Büyükelçi",
    "Cumhurbaşkanı Yardımcısı",
    "Bakanlar Kurulu Üyesi",
    "Yargı Mensubu",
    "Askeri Yetkili",
  ];

  return (
    <>
      <Modal open={true} onClose={() => onClose()} title={ziyaret ? "Ziyaret Düzenle" : "Yeni Üst Düzey Ziyaret"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Select
              label="Protokol Türü"
              value={formData.protokol_turu}
              onChange={(e) => setFormData({ ...formData, protokol_turu: e.target.value })}
            >
              {protokolTurleri.map((tur) => (
                <option key={tur} value={tur}>
                  {tur}
                </option>
              ))}
            </Select>

            <Input
              label="Ad Soyad / Unvan"
              value={formData.ad_soyad}
              onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
              placeholder="Ahmet Yılmaz - İçişleri Bakanı"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Geliş Tarihi"
                type="date"
                value={formData.gelis_tarihi}
                onChange={(e) => setFormData({ ...formData, gelis_tarihi: e.target.value })}
              />
              <Input
                label="Geliş Saati"
                type="time"
                value={formData.gelis_saati}
                onChange={(e) => setFormData({ ...formData, gelis_saati: e.target.value })}
              />
            </div>

            <Input
              label="Karşılama Yeri"
              value={formData.karsilama_yeri}
              onChange={(e) => setFormData({ ...formData, karsilama_yeri: e.target.value })}
              placeholder="Havaalanı / Valilik"
            />

            <Input
              label="Konaklama Yeri"
              value={formData.konaklama_yeri}
              onChange={(e) => setFormData({ ...formData, konaklama_yeri: e.target.value })}
              placeholder="Valilik Konukevi"
            />

            <Textarea
              label="Notlar / Program"
              value={formData.notlar}
              onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
              placeholder="Ziyaret programı ve notlar..."
              rows={6}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {ziyaret ? (
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
                {ziyaret ? "Güncelle" : "Oluştur"}
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
        title="Ziyaret Kaydını Sil"
        message={`${ziyaret?.ad_soyad} - ${ziyaret?.gelis_tarihi} tarihli ziyaret kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
