"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Muhtar {
  id: number;
  ilce: string | null;
  mahalle_koy: string;
  ad_soyad: string;
  gsm: string;
  sabit_tel: string;
  email: string | null;
  foto: string | null;
}

interface MuhtarModalProps {
  muhtar: Muhtar | null;
  onClose: (refresh?: boolean) => void;
}

export function MuhtarModal({ muhtar, onClose }: MuhtarModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    ilce: "",
    mahalle_koy: "",
    ad_soyad: "",
    gsm: "",
    sabit_tel: "",
    email: "",
  });

  useEffect(() => {
    if (muhtar) {
      setFormData({
        ilce: muhtar.ilce || "",
        mahalle_koy: muhtar.mahalle_koy || "",
        ad_soyad: muhtar.ad_soyad || "",
        gsm: muhtar.gsm || "",
        sabit_tel: muhtar.sabit_tel || "",
        email: muhtar.email || "",
      });
    }
  }, [muhtar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = muhtar ? `/api/muhtar/${muhtar.id}` : "/api/muhtar";
      const method = muhtar ? "PUT" : "POST";

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
    if (!muhtar) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/muhtar/${muhtar.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={muhtar ? "Muhtar Düzenle" : "Yeni Muhtar"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="İlçe"
                value={formData.ilce}
                onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
                placeholder="Merkez"
              />
              <Input
                label="Mahalle/Köy"
                required
                value={formData.mahalle_koy}
                onChange={(e) => setFormData({ ...formData, mahalle_koy: e.target.value })}
                placeholder="Cumhuriyet Mahallesi"
              />
            </div>

            <Input
              label="Ad Soyad"
              required
              value={formData.ad_soyad}
              onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
              placeholder="Ahmet Yılmaz"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GSM"
                required
                value={formData.gsm}
                onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                placeholder="0555 123 45 67"
              />
              <Input
                label="Sabit Telefon"
                required
                value={formData.sabit_tel}
                onChange={(e) => setFormData({ ...formData, sabit_tel: e.target.value })}
                placeholder="0212 123 45 67"
              />
            </div>

            <Input
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@example.com"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {muhtar ? (
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
                {muhtar ? "Güncelle" : "Oluştur"}
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
        title="Muhtar Kaydını Sil"
        message={`${muhtar?.ad_soyad} - ${muhtar?.mahalle_koy} kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
