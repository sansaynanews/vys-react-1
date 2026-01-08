"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Proje {
  id: number;
  konu: string;
  sahibi: string;
  kurum: string | null;
  iletisim: string | null;
  baslangic: string | null;
  bitis: string | null;
  durum: string | null;
  hedefler: string | null;
}

interface ProjeModalProps {
  proje: Proje | null;
  onClose: (refresh?: boolean) => void;
}

export function ProjeModal({ proje, onClose }: ProjeModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    konu: "",
    sahibi: "",
    kurum: "",
    iletisim: "",
    baslangic: "",
    bitis: "",
    durum: "Beklemede",
    hedefler: "",
  });

  useEffect(() => {
    if (proje) {
      setFormData({
        konu: proje.konu || "",
        sahibi: proje.sahibi || "",
        kurum: proje.kurum || "",
        iletisim: proje.iletisim || "",
        baslangic: proje.baslangic || "",
        bitis: proje.bitis || "",
        durum: proje.durum || "Beklemede",
        hedefler: proje.hedefler || "",
      });
    }
  }, [proje]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = proje ? `/api/proje/${proje.id}` : "/api/proje";
      const method = proje ? "PUT" : "POST";

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
    if (!proje) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/proje/${proje.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={proje ? "Proje Düzenle" : "Yeni Proje"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Temel Bilgiler */}
            <Input
              label="Proje Konusu"
              required
              value={formData.konu}
              onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
              placeholder="Proje konusu..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Proje Sahibi"
                required
                value={formData.sahibi}
                onChange={(e) => setFormData({ ...formData, sahibi: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
              <Input
                label="Kurum"
                value={formData.kurum}
                onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                placeholder="İl Valiliği"
              />
            </div>

            <Input
              label="İletişim"
              value={formData.iletisim}
              onChange={(e) => setFormData({ ...formData, iletisim: e.target.value })}
              placeholder="0555 123 45 67"
            />

            {/* Tarihler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Başlangıç Tarihi"
                type="date"
                value={formData.baslangic}
                onChange={(e) => setFormData({ ...formData, baslangic: e.target.value })}
              />
              <Input
                label="Bitiş Tarihi"
                type="date"
                value={formData.bitis}
                onChange={(e) => setFormData({ ...formData, bitis: e.target.value })}
              />
            </div>

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

            <Textarea
              label="Hedefler"
              value={formData.hedefler}
              onChange={(e) => setFormData({ ...formData, hedefler: e.target.value })}
              placeholder="Proje hedefleri ve detayları..."
              rows={6}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {proje ? (
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
                {proje ? "Güncelle" : "Oluştur"}
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
        title="Proje Kaydını Sil"
        message={`"${proje?.konu}" projesini silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
