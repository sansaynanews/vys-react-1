"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ZiyaretciKayit {
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

interface ZiyaretciKayitModalProps {
  kayit: ZiyaretciKayit | null;
  onClose: (refresh?: boolean) => void;
}

export function ZiyaretciKayitModal({ kayit, onClose }: ZiyaretciKayitModalProps) {
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
    if (kayit) {
      setFormData({
        ad_soyad: kayit.ad_soyad || "",
        unvan: kayit.unvan || "",
        kurum: kayit.kurum || "",
        iletisim: kayit.iletisim || "",
        giris_tarihi: kayit.giris_tarihi || "",
        giris_saati: kayit.giris_saati || "",
        cikis_saati: kayit.cikis_saati || "",
        kisi_sayisi: kayit.kisi_sayisi?.toString() || "1",
        diger_kisiler: kayit.diger_kisiler || "",
      });
    }
  }, [kayit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        kisi_sayisi: parseInt(formData.kisi_sayisi) || 1,
      };

      const url = kayit ? `/api/ziyaretci-kayit/${kayit.id}` : "/api/ziyaretci-kayit";
      const method = kayit ? "PUT" : "POST";

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
    if (!kayit) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/ziyaretci-kayit/${kayit.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={kayit ? "Kayıt Düzenle" : "Yeni Ziyaretçi Kaydı"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Ziyaretçi Bilgileri */}
            <Input
              label="Ad Soyad"
              required
              value={formData.ad_soyad}
              onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
              placeholder="Ahmet Yılmaz"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Unvan"
                value={formData.unvan}
                onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                placeholder="Müdür"
              />
              <Input
                label="Kurum"
                value={formData.kurum}
                onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                placeholder="İl Milli Eğitim Müdürlüğü"
              />
            </div>

            <Input
              label="İletişim"
              value={formData.iletisim}
              onChange={(e) => setFormData({ ...formData, iletisim: e.target.value })}
              placeholder="0555 123 45 67"
            />

            {/* Giriş-Çıkış Bilgileri */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Giriş-Çıkış Bilgileri</h3>
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
                  helperText="Boş bırakılırsa aktif"
                />
              </div>
            </div>

            {/* Grup Bilgisi */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Beraberindekiler</h3>
              <Input
                label="Kişi Sayısı"
                type="number"
                value={formData.kisi_sayisi}
                onChange={(e) => setFormData({ ...formData, kisi_sayisi: e.target.value })}
                placeholder="1"
              />

              {parseInt(formData.kisi_sayisi) > 1 && (
                <Textarea
                  label="Diğer Kişiler"
                  value={formData.diger_kisiler}
                  onChange={(e) => setFormData({ ...formData, diger_kisiler: e.target.value })}
                  placeholder="Beraberindeki diğer kişilerin isimleri..."
                  rows={3}
                  className="mt-4"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {kayit ? (
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
                {kayit ? "Güncelle" : "Kaydet"}
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
        title="Kayıt Sil"
        message={`${kayit?.ad_soyad} - ${kayit?.giris_tarihi} tarihli ziyaretçi kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
