"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Talimat {
  id: number;
  konu: string;
  verilen_kisi: string;
  kurum: string | null;
  iletisim: string | null;
  tarih: string | null;
  durum: string | null;
  icerik: string | null;
  onem_derecesi: string | null;
  saat: any;
  tamamlanma_tarihi: string | null;
  tamamlayan_kisi: string | null;
}

interface TalimatModalProps {
  talimat: Talimat | null;
  onClose: (refresh?: boolean) => void;
}

export function TalimatModal({ talimat, onClose }: TalimatModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    konu: "",
    verilen_kisi: "",
    kurum: "",
    iletisim: "",
    tarih: "",
    durum: "Beklemede",
    icerik: "",
    onem_derecesi: "Normal",
    saat: "",
    tamamlanma_tarihi: "",
    tamamlayan_kisi: "",
  });

  useEffect(() => {
    if (talimat) {
      setFormData({
        konu: talimat.konu || "",
        verilen_kisi: talimat.verilen_kisi || "",
        kurum: talimat.kurum || "",
        iletisim: talimat.iletisim || "",
        tarih: talimat.tarih || "",
        durum: talimat.durum || "Beklemede",
        icerik: talimat.icerik || "",
        onem_derecesi: talimat.onem_derecesi || "Normal",
        saat: "",
        tamamlanma_tarihi: talimat.tamamlanma_tarihi || "",
        tamamlayan_kisi: talimat.tamamlayan_kisi || "",
      });
    }
  }, [talimat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = talimat ? `/api/talimat/${talimat.id}` : "/api/talimat";
      const method = talimat ? "PUT" : "POST";

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
    if (!talimat) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/talimat/${talimat.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={talimat ? "Talimat Düzenle" : "Yeni Talimat"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Temel Bilgiler */}
            <Input
              label="Konu"
              required
              value={formData.konu}
              onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
              placeholder="Talimat konusu..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Talimatı Veren Kişi"
                required
                value={formData.verilen_kisi}
                onChange={(e) => setFormData({ ...formData, verilen_kisi: e.target.value })}
                placeholder="Vali"
              />
              <Input
                label="Kurum"
                value={formData.kurum}
                onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                placeholder="İl Valiliği"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Tarih"
                type="date"
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
              />
              <Input
                label="Saat"
                type="time"
                value={formData.saat}
                onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
              />
              <Input
                label="İletişim"
                value={formData.iletisim}
                onChange={(e) => setFormData({ ...formData, iletisim: e.target.value })}
                placeholder="0555 123 45 67"
              />
            </div>

            {/* Durum ve Önem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Durum"
                value={formData.durum}
                onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
              >
                <option value="Beklemede">Beklemede</option>
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal">İptal</option>
              </Select>
              <Select
                label="Önem Derecesi"
                value={formData.onem_derecesi}
                onChange={(e) => setFormData({ ...formData, onem_derecesi: e.target.value })}
              >
                <option value="Normal">Normal</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Acil">Acil</option>
              </Select>
            </div>

            <Textarea
              label="İçerik"
              value={formData.icerik}
              onChange={(e) => setFormData({ ...formData, icerik: e.target.value })}
              placeholder="Talimat detayları..."
              rows={4}
            />

            {/* Tamamlanma Bilgileri */}
            {(formData.durum === "Tamamlandı" || talimat?.durum === "Tamamlandı") && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tamamlanma Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tamamlanma Tarihi"
                    type="date"
                    value={formData.tamamlanma_tarihi}
                    onChange={(e) => setFormData({ ...formData, tamamlanma_tarihi: e.target.value })}
                  />
                  <Input
                    label="Tamamlayan Kişi"
                    value={formData.tamamlayan_kisi}
                    onChange={(e) => setFormData({ ...formData, tamamlayan_kisi: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {talimat ? (
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
                {talimat ? "Güncelle" : "Oluştur"}
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
        title="Talimat Kaydını Sil"
        message={`${talimat?.konu} talimatını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
