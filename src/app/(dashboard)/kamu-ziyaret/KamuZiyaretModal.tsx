"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface KamuZiyaret {
  id: number;
  kurum: string | null;
  yer: string | null;
  tarih: string | null;
  saat: string | null;
  talepler: string | null;
}

interface KamuZiyaretModalProps {
  ziyaret: KamuZiyaret | null;
  onClose: (refresh?: boolean) => void;
}

export function KamuZiyaretModal({ ziyaret, onClose }: KamuZiyaretModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    kurum: "",
    yer: "",
    tarih: "",
    saat: "",
    talepler: "",
  });

  useEffect(() => {
    if (ziyaret) {
      setFormData({
        kurum: ziyaret.kurum || "",
        yer: ziyaret.yer || "",
        tarih: ziyaret.tarih || "",
        saat: ziyaret.saat || "",
        talepler: ziyaret.talepler || "",
      });
    }
  }, [ziyaret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = ziyaret ? `/api/kamu-ziyaret/${ziyaret.id}` : "/api/kamu-ziyaret";
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
      const response = await fetch(`/api/kamu-ziyaret/${ziyaret.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={ziyaret ? "Ziyaret Düzenle" : "Yeni Kamu Ziyareti"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              label="Kurum"
              value={formData.kurum}
              onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
              placeholder="İl Milli Eğitim Müdürlüğü"
            />

            <Input
              label="Yer"
              value={formData.yer}
              onChange={(e) => setFormData({ ...formData, yer: e.target.value })}
              placeholder="İl Milli Eğitim Müdürlüğü Toplantı Salonu"
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

            <Textarea
              label="Talepler"
              value={formData.talepler}
              onChange={(e) => setFormData({ ...formData, talepler: e.target.value })}
              placeholder="Ziyaret talepleri ve notlar..."
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
        message={`${ziyaret?.kurum} - ${ziyaret?.tarih} tarihli ziyaret kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
