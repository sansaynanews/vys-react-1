"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  aile_ferdi: string | null;
  saat: any;
}

interface SehitGaziZiyaretModalProps {
  ziyaret: SehitGaziZiyaret | null;
  onClose: (refresh?: boolean) => void;
}

export function SehitGaziZiyaretModal({ ziyaret, onClose }: SehitGaziZiyaretModalProps) {
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
    ziyaret_tarih: "",
    ziyaret_saat: "",
    talepler: "",
    aile_ferdi: "",
    saat: "",
  });

  useEffect(() => {
    if (ziyaret) {
      setFormData({
        tur: ziyaret.tur || "Şehit",
        ad_soyad: ziyaret.ad_soyad || "",
        kurum: ziyaret.kurum || "",
        medeni: ziyaret.medeni || "Evli",
        es_ad: ziyaret.es_ad || "",
        anne_ad: ziyaret.anne_ad || "",
        baba_ad: ziyaret.baba_ad || "",
        cocuk_sayisi: ziyaret.cocuk_sayisi?.toString() || "0",
        cocuk_adlari: ziyaret.cocuk_adlari || "",
        olay_yeri: ziyaret.olay_yeri || "",
        olay_tarih: ziyaret.olay_tarih || "",
        ziyaret_tarih: ziyaret.ziyaret_tarih || "",
        ziyaret_saat: ziyaret.ziyaret_saat || "",
        talepler: ziyaret.talepler || "",
        aile_ferdi: ziyaret.aile_ferdi || "",
        saat: "",
      });
    }
  }, [ziyaret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        cocuk_sayisi: parseInt(formData.cocuk_sayisi) || 0,
      };

      const url = ziyaret ? `/api/sehit-gazi-ziyaret/${ziyaret.id}` : "/api/sehit-gazi-ziyaret";
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
      const response = await fetch(`/api/sehit-gazi-ziyaret/${ziyaret.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={ziyaret ? "Ziyaret Düzenle" : "Yeni Ziyaret Kaydı"}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Medeni Durum"
                  value={formData.medeni}
                  onChange={(e) => setFormData({ ...formData, medeni: e.target.value })}
                >
                  <option value="Evli">Evli</option>
                  <option value="Bekar">Bekar</option>
                </Select>

                <Input
                  label="Aile Ferdi"
                  value={formData.aile_ferdi}
                  onChange={(e) => setFormData({ ...formData, aile_ferdi: e.target.value })}
                  placeholder="Eş / Anne / Baba"
                />
              </div>

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
                  <Input
                    label="Çocuk Adları"
                    value={formData.cocuk_adlari}
                    onChange={(e) => setFormData({ ...formData, cocuk_adlari: e.target.value })}
                    placeholder="Ali, Veli, Ayşe"
                  />
                )}
              </div>
            </div>

            {/* Ziyaret Bilgileri */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Ziyaret Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Ziyaret Tarihi"
                  type="date"
                  value={formData.ziyaret_tarih}
                  onChange={(e) => setFormData({ ...formData, ziyaret_tarih: e.target.value })}
                />
                <Input
                  label="Ziyaret Saati"
                  type="time"
                  value={formData.ziyaret_saat}
                  onChange={(e) => setFormData({ ...formData, ziyaret_saat: e.target.value })}
                />
              </div>

              <Textarea
                label="Talepler"
                value={formData.talepler}
                onChange={(e) => setFormData({ ...formData, talepler: e.target.value })}
                placeholder="Aile talepleri ve notlar..."
                rows={4}
                className="mt-4"
              />
            </div>
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
        message={`${ziyaret?.ad_soyad} - ${ziyaret?.ziyaret_tarih} tarihli ziyaret kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
