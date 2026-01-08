"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  foto: string | null;
}

interface SehitGaziBilgiModalProps {
  kayit: SehitGaziBilgi | null;
  onClose: (refresh?: boolean) => void;
}

export function SehitGaziBilgiModal({ kayit, onClose }: SehitGaziBilgiModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    tur: "Şehit",
    ad_soyad: "",
    kurum: "",
    medeni: "Evli",
    es_ad: "",
    anne_ad: "",
    baba_ad: "",
    cocuk_sayisi: "0",
    cocuk_adlari: "",
    olay_yeri: "",
    olay_tarih: "",
    foto: "",
  });

  useEffect(() => {
    if (kayit) {
      setFormData({
        tur: kayit.tur || "Şehit",
        ad_soyad: kayit.ad_soyad || "",
        kurum: kayit.kurum || "",
        medeni: kayit.medeni || "Evli",
        es_ad: kayit.es_ad || "",
        anne_ad: kayit.anne_ad || "",
        baba_ad: kayit.baba_ad || "",
        cocuk_sayisi: kayit.cocuk_sayisi?.toString() || "0",
        cocuk_adlari: kayit.cocuk_adlari || "",
        olay_yeri: kayit.olay_yeri || "",
        olay_tarih: kayit.olay_tarih || "",
        foto: kayit.foto || "",
      });
    }
  }, [kayit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        cocuk_sayisi: parseInt(formData.cocuk_sayisi) || 0,
      };

      const url = kayit ? `/api/sehit-gazi-bilgi/${kayit.id}` : "/api/sehit-gazi-bilgi";
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
      const response = await fetch(`/api/sehit-gazi-bilgi/${kayit.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={kayit ? "Kayıt Düzenle" : "Yeni Şehit/Gazi Kaydı"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tür"
                value={formData.tur}
                onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
              >
                <option value="Şehit">Şehit</option>
                <option value="Gazi">Gazi</option>
              </Select>

              <Input
                label="Ad Soyad"
                value={formData.ad_soyad}
                onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <Input
              label="Kurum"
              value={formData.kurum}
              onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
              placeholder="Türk Silahlı Kuvvetleri"
            />

            {/* Olay Bilgileri */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Olay Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Olay Yeri"
                  value={formData.olay_yeri}
                  onChange={(e) => setFormData({ ...formData, olay_yeri: e.target.value })}
                  placeholder="Şırnak"
                />
                <Input
                  label="Olay Tarihi"
                  type="date"
                  value={formData.olay_tarih}
                  onChange={(e) => setFormData({ ...formData, olay_tarih: e.target.value })}
                />
              </div>
            </div>

            {/* Aile Bilgileri */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Aile Bilgileri</h3>
              <Select
                label="Medeni Durum"
                value={formData.medeni}
                onChange={(e) => setFormData({ ...formData, medeni: e.target.value })}
              >
                <option value="Evli">Evli</option>
                <option value="Bekar">Bekar</option>
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Input
                  label="Eş Adı"
                  value={formData.es_ad}
                  onChange={(e) => setFormData({ ...formData, es_ad: e.target.value })}
                  placeholder="Fatma Yılmaz"
                />
                <Input
                  label="Anne Adı"
                  value={formData.anne_ad}
                  onChange={(e) => setFormData({ ...formData, anne_ad: e.target.value })}
                  placeholder="Ayşe"
                />
                <Input
                  label="Baba Adı"
                  value={formData.baba_ad}
                  onChange={(e) => setFormData({ ...formData, baba_ad: e.target.value })}
                  placeholder="Mehmet"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Çocuk Sayısı"
                  type="number"
                  value={formData.cocuk_sayisi}
                  onChange={(e) => setFormData({ ...formData, cocuk_sayisi: e.target.value })}
                  placeholder="0"
                />
                {parseInt(formData.cocuk_sayisi) > 0 && (
                  <Textarea
                    label="Çocuk Adları"
                    value={formData.cocuk_adlari}
                    onChange={(e) => setFormData({ ...formData, cocuk_adlari: e.target.value })}
                    placeholder="Ali, Veli, Ayşe"
                    rows={2}
                  />
                )}
              </div>
            </div>

            {/* Fotoğraf */}
            <Input
              label="Fotoğraf URL"
              value={formData.foto}
              onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
              placeholder="/uploads/foto.jpg"
            />
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
                {kayit ? "Güncelle" : "Oluştur"}
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
        message={`${kayit?.ad_soyad} kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
