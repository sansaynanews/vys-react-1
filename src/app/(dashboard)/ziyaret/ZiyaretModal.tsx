"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Ziyaret {
  id: number;
  ad_soyad: string;
  unvan: string | null;
  kurum: string | null;
  iletisim: string | null;
  giris_tarihi: string;
  giris_saati: string;
  cikis_saati: string | null;
  kisi_sayisi: number | null;
  diger_kisiler: string | null;
}

interface ZiyaretModalProps {
  ziyaret: Ziyaret | null;
  onClose: (refresh?: boolean) => void;
}

export function ZiyaretModal({ ziyaret, onClose }: ZiyaretModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    ad_soyad: "",
    unvan: "",
    kurum: "",
    iletisim: "",
    giris_tarihi: "",
    giris_saati: "",
    cikis_saati: "",
    kisi_sayisi: "1",
    diger_kisiler: "",
  });

  useEffect(() => {
    if (ziyaret) {
      setFormData({
        ad_soyad: ziyaret.ad_soyad || "",
        unvan: ziyaret.unvan || "",
        kurum: ziyaret.kurum || "",
        iletisim: ziyaret.iletisim || "",
        giris_tarihi: ziyaret.giris_tarihi || "",
        giris_saati: ziyaret.giris_saati || "",
        cikis_saati: ziyaret.cikis_saati || "",
        kisi_sayisi: ziyaret.kisi_sayisi?.toString() || "1",
        diger_kisiler: ziyaret.diger_kisiler || "",
      });
    }
  }, [ziyaret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        kisi_sayisi: parseInt(formData.kisi_sayisi) || 1,
      };

      const url = ziyaret ? `/api/ziyaret/${ziyaret.id}` : "/api/ziyaret";
      const method = ziyaret ? "PUT" : "POST";

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
    if (!ziyaret) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/ziyaret/${ziyaret.id}`, {
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

  return (
    <>
      <Modal open={true} onClose={() => onClose()} title={ziyaret ? "Ziyaretçi Düzenle" : "Yeni Ziyaretçi"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Ziyaretçi Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ad Soyad"
                required
                value={formData.ad_soyad}
                onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
              <Input
                label="Ünvan"
                value={formData.unvan}
                onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                placeholder="Müdür"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kurum"
                value={formData.kurum}
                onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                placeholder="İl Milli Eğitim Müdürlüğü"
              />
              <Input
                label="İletişim"
                value={formData.iletisim}
                onChange={(e) => setFormData({ ...formData, iletisim: e.target.value })}
                placeholder="0555 123 45 67"
              />
            </div>

            {/* Ziyaret Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Giriş Tarihi"
                type="date"
                required
                value={formData.giris_tarihi}
                onChange={(e) => setFormData({ ...formData, giris_tarihi: e.target.value })}
              />
              <Input
                label="Giriş Saati"
                type="time"
                required
                value={formData.giris_saati}
                onChange={(e) => setFormData({ ...formData, giris_saati: e.target.value })}
              />
              <Input
                label="Çıkış Saati"
                type="time"
                value={formData.cikis_saati}
                onChange={(e) => setFormData({ ...formData, cikis_saati: e.target.value })}
              />
            </div>

            <Input
              label="Kişi Sayısı"
              type="number"
              value={formData.kisi_sayisi}
              onChange={(e) => setFormData({ ...formData, kisi_sayisi: e.target.value })}
              placeholder="1"
              helperText="Ziyaretçi ile birlikte gelen toplam kişi sayısı"
            />

            {parseInt(formData.kisi_sayisi) > 1 && (
              <Textarea
                label="Diğer Kişiler"
                value={formData.diger_kisiler}
                onChange={(e) => setFormData({ ...formData, diger_kisiler: e.target.value })}
                placeholder="Beraberindeki kişilerin adları..."
                rows={3}
              />
            )}
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
        title="Ziyaretçi Kaydını Sil"
        message={`${ziyaret?.ad_soyad} - ${ziyaret?.giris_tarihi} tarihli ziyaretçi kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
