"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AmirIzin {
  id: number;
  kurum_adi: string | null;
  amir_ad: string | null;
  baslangic: string | null;
  bitis: string | null;
  vekil_ad: string | null;
  vekil_unvan: string | null;
  vekil_tel: string | null;
  izin_turu: string | null;
}

interface IzinModalProps {
  izin: AmirIzin | null;
  onClose: (refresh?: boolean) => void;
}

export function IzinModal({ izin, onClose }: IzinModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    kurum_adi: "",
    amir_ad: "",
    baslangic: "",
    bitis: "",
    vekil_ad: "",
    vekil_unvan: "",
    vekil_tel: "",
    izin_turu: "Yıllık İzin",
  });

  useEffect(() => {
    if (izin) {
      setFormData({
        kurum_adi: izin.kurum_adi || "",
        amir_ad: izin.amir_ad || "",
        baslangic: izin.baslangic || "",
        bitis: izin.bitis || "",
        vekil_ad: izin.vekil_ad || "",
        vekil_unvan: izin.vekil_unvan || "",
        vekil_tel: izin.vekil_tel || "",
        izin_turu: izin.izin_turu || "Yıllık İzin",
      });
    }
  }, [izin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = izin ? `/api/kurum-amir/izin/${izin.id}` : "/api/kurum-amir/izin";
      const method = izin ? "PUT" : "POST";

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
    if (!izin) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/kurum-amir/izin/${izin.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={izin ? "İzin Düzenle" : "Yeni İzin"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Amir Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kurum Adı"
                value={formData.kurum_adi}
                onChange={(e) => setFormData({ ...formData, kurum_adi: e.target.value })}
                placeholder="İl Milli Eğitim Müdürlüğü"
              />
              <Input
                label="Amir Adı"
                required
                value={formData.amir_ad}
                onChange={(e) => setFormData({ ...formData, amir_ad: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
            </div>

            {/* İzin Tarihleri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Başlangıç Tarihi"
                type="date"
                required
                value={formData.baslangic}
                onChange={(e) => setFormData({ ...formData, baslangic: e.target.value })}
              />
              <Input
                label="Bitiş Tarihi"
                type="date"
                required
                value={formData.bitis}
                onChange={(e) => setFormData({ ...formData, bitis: e.target.value })}
              />
              <Select
                label="İzin Türü"
                value={formData.izin_turu}
                onChange={(e) => setFormData({ ...formData, izin_turu: e.target.value })}
              >
                <option value="Yıllık İzin">Yıllık İzin</option>
                <option value="Mazeret İzni">Mazeret İzni</option>
                <option value="Hastalık İzni">Hastalık İzni</option>
                <option value="Diğer">Diğer</option>
              </Select>
            </div>

            {/* Vekil Bilgileri */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Vekil Bilgileri</h3>
              <div className="space-y-4">
                <Input
                  label="Vekil Adı"
                  value={formData.vekil_ad}
                  onChange={(e) => setFormData({ ...formData, vekil_ad: e.target.value })}
                  placeholder="Mehmet Demir"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vekil Ünvanı"
                    value={formData.vekil_unvan}
                    onChange={(e) => setFormData({ ...formData, vekil_unvan: e.target.value })}
                    placeholder="Müdür Yardımcısı"
                  />
                  <Input
                    label="Vekil Telefon"
                    value={formData.vekil_tel}
                    onChange={(e) => setFormData({ ...formData, vekil_tel: e.target.value })}
                    placeholder="0555 123 45 67"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {izin ? (
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
                {izin ? "Güncelle" : "Oluştur"}
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
        title="İzin Kaydını Sil"
        message={`${izin?.amir_ad} - ${izin?.baslangic} / ${izin?.bitis} tarihli izin kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
