"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Stok {
  id: number;
  adi: string;
  cesit: string;
  miktar?: number | null;
  kategori?: string | null;
  tur?: string | null;
}

interface StokModalProps {
  stok: Stok | null;
  onClose: (refresh?: boolean) => void;
}

export function StokModal({ stok, onClose }: StokModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    adi: "",
    cesit: "",
    miktar: "",
    kategori: "Genel",
    tur: "genel",
  });

  useEffect(() => {
    if (stok) {
      setFormData({
        adi: stok.adi || "",
        cesit: stok.cesit || "",
        miktar: stok.miktar?.toString() || "0",
        kategori: stok.kategori || "Genel",
        tur: stok.tur || "genel",
      });
    }
  }, [stok]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        adi: formData.adi,
        cesit: formData.cesit,
        miktar: parseInt(formData.miktar) || 0,
        kategori: formData.kategori,
        tur: formData.tur,
      };

      const url = stok ? `/api/stok/${stok.id}` : "/api/stok";
      const method = stok ? "PUT" : "POST";

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
    if (!stok) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/stok/${stok.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={stok ? "Stok Düzenle" : "Yeni Stok"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ürün Adı"
                required
                value={formData.adi}
                onChange={(e) => setFormData({ ...formData, adi: e.target.value })}
                placeholder="Kalem"
              />
              <Input
                label="Çeşit"
                required
                value={formData.cesit}
                onChange={(e) => setFormData({ ...formData, cesit: e.target.value })}
                placeholder="Tükenmez Kalem"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Başlangıç Miktarı"
                type="number"
                value={formData.miktar}
                onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
                placeholder="0"
                helperText="Stok hareketi ile güncellenecek"
              />
              <Select
                label="Kategori"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              >
                <option value="Genel">Genel</option>
                <option value="Kırtasiye">Kırtasiye</option>
                <option value="Temizlik">Temizlik</option>
                <option value="Elektronik">Elektronik</option>
                <option value="Mobilya">Mobilya</option>
                <option value="Gıda">Gıda</option>
                <option value="Diğer">Diğer</option>
              </Select>
              <Select
                label="Tür"
                value={formData.tur}
                onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
              >
                <option value="genel">Genel</option>
                <option value="ozel">Özel</option>
              </Select>
            </div>

            {stok && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Not</div>
                  <div>
                    Stok miktarı güncellemeleri için "Stok Hareketleri" sayfasını kullanın.
                    Burada sadece başlangıç değeri değiştirilebilir.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {stok ? (
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
                {stok ? "Güncelle" : "Oluştur"}
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
        title="Stok Kartını Sil"
        message={`${stok?.adi} - ${stok?.cesit} stok kartını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
