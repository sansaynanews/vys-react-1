"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Etkinlik {
  id: number;
  adi: string | null;
  kurum: string | null;
  tarih: string | null;
  orijinal_tarih: string | null;
  saat: string | null;
  yer: string | null;
  detay: string | null;
  tekrar_yillik: boolean | null;
}

interface EtkinlikModalProps {
  etkinlik: Etkinlik | null;
  onClose: (refresh?: boolean) => void;
}

export function EtkinlikModal({ etkinlik, onClose }: EtkinlikModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    adi: "",
    kurum: "",
    tarih: "",
    orijinal_tarih: "",
    saat: "",
    yer: "",
    detay: "",
    tekrar_yillik: false,
  });

  useEffect(() => {
    if (etkinlik) {
      setFormData({
        adi: etkinlik.adi || "",
        kurum: etkinlik.kurum || "",
        tarih: etkinlik.tarih || "",
        orijinal_tarih: etkinlik.orijinal_tarih || "",
        saat: etkinlik.saat || "",
        yer: etkinlik.yer || "",
        detay: etkinlik.detay || "",
        tekrar_yillik: etkinlik.tekrar_yillik || false,
      });
    }
  }, [etkinlik]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = etkinlik ? `/api/etkinlik/${etkinlik.id}` : "/api/etkinlik";
      const method = etkinlik ? "PUT" : "POST";

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
    if (!etkinlik) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/etkinlik/${etkinlik.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={etkinlik ? "Etkinlik Düzenle" : "Yeni Etkinlik"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              label="Etkinlik Adı"
              value={formData.adi}
              onChange={(e) => setFormData({ ...formData, adi: e.target.value })}
              placeholder="23 Nisan Ulusal Egemenlik ve Çocuk Bayramı"
            />

            <Input
              label="Kurum"
              value={formData.kurum}
              onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
              placeholder="İl Valiliği"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <Input
              label="Yer"
              value={formData.yer}
              onChange={(e) => setFormData({ ...formData, yer: e.target.value })}
              placeholder="Valilik Tören Alanı"
            />

            <Input
              label="Orijinal Tarih"
              type="date"
              value={formData.orijinal_tarih}
              onChange={(e) => setFormData({ ...formData, orijinal_tarih: e.target.value })}
              helperText="Yıllık tekrarlanan etkinlikler için ilk tarih"
            />

            <Textarea
              label="Detay"
              value={formData.detay}
              onChange={(e) => setFormData({ ...formData, detay: e.target.value })}
              placeholder="Etkinlik detayları..."
              rows={6}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="tekrar_yillik"
                checked={formData.tekrar_yillik}
                onChange={(e) => setFormData({ ...formData, tekrar_yillik: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="tekrar_yillik" className="ml-2 text-sm font-medium text-gray-900">
                Her yıl tekrarla
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {etkinlik ? (
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
                {etkinlik ? "Güncelle" : "Oluştur"}
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
        title="Etkinlik Kaydını Sil"
        message={`"${etkinlik?.adi}" etkinliğini silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
