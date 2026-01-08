"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface KurumAmir {
  id: number;
  kurum_adi: string;
  ad_soyad: string;
  unvan: string | null;
  email: string | null;
  gsm: string | null;
  sabit_tel: string | null;
  foto: string | null;
}

interface AmirModalProps {
  amir: KurumAmir | null;
  onClose: (refresh?: boolean) => void;
}

export function AmirModal({ amir, onClose }: AmirModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    kurum_adi: "",
    ad_soyad: "",
    unvan: "",
    email: "",
    gsm: "",
    sabit_tel: "",
  });

  useEffect(() => {
    if (amir) {
      setFormData({
        kurum_adi: amir.kurum_adi || "",
        ad_soyad: amir.ad_soyad || "",
        unvan: amir.unvan || "",
        email: amir.email || "",
        gsm: amir.gsm || "",
        sabit_tel: amir.sabit_tel || "",
      });
    }
  }, [amir]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = amir ? `/api/kurum-amir/${amir.id}` : "/api/kurum-amir";
      const method = amir ? "PUT" : "POST";

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
    if (!amir) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/kurum-amir/${amir.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={amir ? "Amir Düzenle" : "Yeni Amir"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kurum Adı"
                required
                value={formData.kurum_adi}
                onChange={(e) => setFormData({ ...formData, kurum_adi: e.target.value })}
                placeholder="İl Milli Eğitim Müdürlüğü"
              />
              <Input
                label="Ad Soyad"
                required
                value={formData.ad_soyad}
                onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <Input
              label="Ünvan"
              value={formData.unvan}
              onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
              placeholder="İl Milli Eğitim Müdürü"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@example.com"
              />
              <Input
                label="GSM"
                value={formData.gsm}
                onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                placeholder="0555 123 45 67"
              />
            </div>

            <Input
              label="Sabit Telefon"
              value={formData.sabit_tel}
              onChange={(e) => setFormData({ ...formData, sabit_tel: e.target.value })}
              placeholder="0212 123 45 67"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {amir ? (
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
                {amir ? "Güncelle" : "Oluştur"}
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
        title="Amir Kaydını Sil"
        message={`${amir?.ad_soyad} - ${amir?.kurum_adi} kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
