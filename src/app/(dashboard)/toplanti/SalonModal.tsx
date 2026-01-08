"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Salon {
  id: number;
  ad: string;
  kapasite?: number | null;
  konum?: string | null;
  ekipman?: string | null;
  notlar?: string | null;
}

interface SalonModalProps {
  salon: Salon | null;
  onClose: (refresh?: boolean) => void;
}

export function SalonModal({ salon, onClose }: SalonModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    ad: "",
    kapasite: "",
    konum: "",
    ekipman: "",
    notlar: "",
  });

  useEffect(() => {
    if (salon) {
      setFormData({
        ad: salon.ad || "",
        kapasite: salon.kapasite?.toString() || "",
        konum: salon.konum || "",
        ekipman: salon.ekipman || "",
        notlar: salon.notlar || "",
      });
    }
  }, [salon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ad: formData.ad,
        kapasite: formData.kapasite ? parseInt(formData.kapasite) : undefined,
        konum: formData.konum || undefined,
        ekipman: formData.ekipman || undefined,
        notlar: formData.notlar || undefined,
      };

      const url = salon ? `/api/toplanti-salon/${salon.id}` : "/api/toplanti-salon";
      const method = salon ? "PUT" : "POST";

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
    if (!salon) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/toplanti-salon/${salon.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={salon ? "Salon Düzenle" : "Yeni Salon"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              label="Salon Adı"
              required
              value={formData.ad}
              onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
              placeholder="Büyük Toplantı Salonu"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kapasite"
                type="number"
                value={formData.kapasite}
                onChange={(e) => setFormData({ ...formData, kapasite: e.target.value })}
                placeholder="50"
                helperText="Kişi sayısı"
              />
              <Input
                label="Konum"
                value={formData.konum}
                onChange={(e) => setFormData({ ...formData, konum: e.target.value })}
                placeholder="2. Kat, 205 No'lu Oda"
              />
            </div>

            <Textarea
              label="Ekipman"
              value={formData.ekipman}
              onChange={(e) => setFormData({ ...formData, ekipman: e.target.value })}
              placeholder="Projeksiyon, Ses Sistemi, Beyaz Tahta..."
              rows={3}
            />

            <Textarea
              label="Notlar"
              value={formData.notlar}
              onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
              placeholder="Ek bilgiler ve notlar..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {salon ? (
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
                {salon ? "Güncelle" : "Oluştur"}
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
        title="Salonu Sil"
        message={`${salon?.ad} salonunu silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
