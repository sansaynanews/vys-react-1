"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface KonusmaMetni {
  id: number;
  kategori: string;
  baslik: string;
  icerik: string;
  tarih: string | null;
  saat: any;
}

interface KonusmaMetniModalProps {
  metin: KonusmaMetni | null;
  onClose: (refresh?: boolean) => void;
}

export function KonusmaMetniModal({ metin, onClose }: KonusmaMetniModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    kategori: "Açılış",
    baslik: "",
    icerik: "",
    tarih: "",
    saat: "",
  });

  useEffect(() => {
    if (metin) {
      setFormData({
        kategori: metin.kategori || "Açılış",
        baslik: metin.baslik || "",
        icerik: metin.icerik || "",
        tarih: metin.tarih || "",
        saat: "",
      });
    }
  }, [metin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = metin ? `/api/konusma-metni/${metin.id}` : "/api/konusma-metni";
      const method = metin ? "PUT" : "POST";

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
    if (!metin) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/konusma-metni/${metin.id}`, {
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

  const kategoriler = ["Açılış", "Kapanış", "Toplantı", "Konferans", "Protokol"];

  return (
    <>
      <Modal open={true} onClose={() => onClose()} title={metin ? "Konuşma Metni Düzenle" : "Yeni Konuşma Metni"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Kategori"
                required
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              >
                {kategoriler.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </Select>

              <Input
                label="Tarih"
                type="date"
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
              />
            </div>

            <Input
              label="Başlık"
              required
              value={formData.baslik}
              onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
              placeholder="Konuşma başlığı..."
            />

            <Textarea
              label="İçerik"
              required
              value={formData.icerik}
              onChange={(e) => setFormData({ ...formData, icerik: e.target.value })}
              placeholder="Konuşma metni içeriği..."
              rows={12}
            />

            <Input
              label="Saat"
              type="time"
              value={formData.saat}
              onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {metin ? (
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
                {metin ? "Güncelle" : "Oluştur"}
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
        title="Konuşma Metnini Sil"
        message={`"${metin?.baslik}" başlıklı konuşma metnini silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
