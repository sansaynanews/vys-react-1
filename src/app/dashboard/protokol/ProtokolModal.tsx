"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Protokol {
  id: number;
  sira_no: number | null;
  ad_soyad: string | null;
  unvan: string | null;
  kurum: string | null;
  telefon: string | null;
  eposta: string | null;
}

interface ProtokolModalProps {
  protokol: Protokol | null;
  onClose: (refresh?: boolean) => void;
}

export function ProtokolModal({ protokol, onClose }: ProtokolModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    sira_no: "",
    ad_soyad: "",
    unvan: "",
    kurum: "",
    telefon: "",
    eposta: "",
  });

  useEffect(() => {
    if (protokol) {
      setFormData({
        sira_no: protokol.sira_no?.toString() || "",
        ad_soyad: protokol.ad_soyad || "",
        unvan: protokol.unvan || "",
        kurum: protokol.kurum || "",
        telefon: protokol.telefon || "",
        eposta: protokol.eposta || "",
      });
    }
  }, [protokol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        sira_no: formData.sira_no ? parseInt(formData.sira_no) : undefined,
      };

      const url = protokol ? `/api/protokol/${protokol.id}` : "/api/protokol";
      const method = protokol ? "PUT" : "POST";

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
    if (!protokol) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/protokol/${protokol.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={protokol ? "Protokol Düzenle" : "Yeni Protokol"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Sıra No"
                type="number"
                value={formData.sira_no}
                onChange={(e) => setFormData({ ...formData, sira_no: e.target.value })}
                placeholder="1"
              />
              <div className="md:col-span-2">
                <Input
                  label="Ad Soyad"
                  required
                  value={formData.ad_soyad}
                  onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ünvan"
                value={formData.unvan}
                onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                placeholder="Vali"
              />
              <Input
                label="Kurum"
                value={formData.kurum}
                onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                placeholder="İl Valiliği"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefon"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                placeholder="0555 123 45 67"
              />
              <Input
                label="E-posta"
                type="email"
                value={formData.eposta}
                onChange={(e) => setFormData({ ...formData, eposta: e.target.value })}
                placeholder="ornek@example.com"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {protokol ? (
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
                {protokol ? "Güncelle" : "Oluştur"}
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
        title="Protokol Kaydını Sil"
        message={`${protokol?.ad_soyad} - ${protokol?.kurum} kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
