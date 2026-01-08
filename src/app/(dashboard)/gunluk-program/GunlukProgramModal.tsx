"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface GunlukProgram {
  id: number;
  tarih: string;
  saat: string;
  tur: string | null;
  aciklama: string | null;
}

interface GunlukProgramModalProps {
  program: GunlukProgram | null;
  onClose: (refresh?: boolean) => void;
}

export function GunlukProgramModal({ program, onClose }: GunlukProgramModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    tarih: "",
    saat: "",
    tur: "Toplantı",
    aciklama: "",
  });

  useEffect(() => {
    if (program) {
      setFormData({
        tarih: program.tarih || "",
        saat: program.saat || "",
        tur: program.tur || "Toplantı",
        aciklama: program.aciklama || "",
      });
    }
  }, [program]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = program ? `/api/gunluk-program/${program.id}` : "/api/gunluk-program";
      const method = program ? "PUT" : "POST";

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
    if (!program) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/gunluk-program/${program.id}`, {
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

  const turler = ["Toplantı", "Ziyaret", "Etkinlik", "Randevu"];

  return (
    <>
      <Modal open={true} onClose={() => onClose()} title={program ? "Program Düzenle" : "Yeni Program Ekle"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Tarih ve Saat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tarih"
                type="date"
                required
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
              />
              <Input
                label="Saat"
                type="time"
                required
                value={formData.saat}
                onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
              />
            </div>

            <Select
              label="Tür"
              value={formData.tur}
              onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
            >
              {turler.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Textarea
              label="Açıklama"
              value={formData.aciklama}
              onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
              placeholder="Program detayları..."
              rows={6}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {program ? (
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
                {program ? "Güncelle" : "Oluştur"}
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
        title="Program Kaydını Sil"
        message={`${program?.tarih} - ${program?.saat} tarihli programı silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
