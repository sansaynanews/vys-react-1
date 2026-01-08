"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Evrak {
  id: number;
  gelen_kurum: string | null;
  tur: string | null;
  konu: string | null;
  notlar: string | null;
  evrak_tarih: string | null;
  evrak_sayi: string | null;
  gelis_tarih: string | null;
  teslim_alan: string | null;
  cikis_tarihi: string | null;
  sunus_tarihi: string | null;
}

interface EvrakModalProps {
  evrak: Evrak | null;
  onClose: (refresh?: boolean) => void;
}

export function EvrakModal({ evrak, onClose }: EvrakModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    gelen_kurum: "",
    tur: "Gelen",
    konu: "",
    notlar: "",
    evrak_tarih: "",
    evrak_sayi: "",
    gelis_tarih: "",
    teslim_alan: "",
    cikis_tarihi: "",
    sunus_tarihi: "",
    saat: "",
  });

  useEffect(() => {
    if (evrak) {
      setFormData({
        gelen_kurum: evrak.gelen_kurum || "",
        tur: evrak.tur || "Gelen",
        konu: evrak.konu || "",
        notlar: evrak.notlar || "",
        evrak_tarih: evrak.evrak_tarih || "",
        evrak_sayi: evrak.evrak_sayi || "",
        gelis_tarih: evrak.gelis_tarih || "",
        teslim_alan: evrak.teslim_alan || "",
        cikis_tarihi: evrak.cikis_tarihi || "",
        sunus_tarihi: evrak.sunus_tarihi || "",
        saat: "",
      });
    }
  }, [evrak]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = evrak ? `/api/evrak/${evrak.id}` : "/api/evrak";
      const method = evrak ? "PUT" : "POST";

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
    if (!evrak) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/evrak/${evrak.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={evrak ? "Evrak Düzenle" : "Yeni Evrak"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Evrak Tarihi"
                type="date"
                value={formData.evrak_tarih}
                onChange={(e) => setFormData({ ...formData, evrak_tarih: e.target.value })}
              />
              <Input
                label="Evrak Sayısı"
                value={formData.evrak_sayi}
                onChange={(e) => setFormData({ ...formData, evrak_sayi: e.target.value })}
                placeholder="2024/123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Gelen Kurum"
                required
                value={formData.gelen_kurum}
                onChange={(e) => setFormData({ ...formData, gelen_kurum: e.target.value })}
                placeholder="İl Milli Eğitim Müdürlüğü"
              />
              <Select
                label="Evrak Türü"
                value={formData.tur}
                onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
              >
                <option value="Gelen">Gelen</option>
                <option value="Giden">Giden</option>
                <option value="İç Yazışma">İç Yazışma</option>
              </Select>
            </div>

            <Textarea
              label="Konu"
              required
              value={formData.konu}
              onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
              placeholder="Evrak konusu..."
              rows={3}
            />

            {/* Tarih Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Geliş Tarihi"
                type="date"
                value={formData.gelis_tarih}
                onChange={(e) => setFormData({ ...formData, gelis_tarih: e.target.value })}
              />
              <Input
                label="Teslim Alan"
                value={formData.teslim_alan}
                onChange={(e) => setFormData({ ...formData, teslim_alan: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Çıkış Tarihi"
                type="date"
                value={formData.cikis_tarihi}
                onChange={(e) => setFormData({ ...formData, cikis_tarihi: e.target.value })}
              />
              <Input
                label="Sunuş Tarihi"
                type="date"
                value={formData.sunus_tarihi}
                onChange={(e) => setFormData({ ...formData, sunus_tarihi: e.target.value })}
                helperText="Tamamlandığında doldurulur"
              />
            </div>

            <Textarea
              label="Notlar"
              value={formData.notlar}
              onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
              placeholder="Ek notlar..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {evrak ? (
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
                {evrak ? "Güncelle" : "Oluştur"}
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
        title="Evrak Kaydını Sil"
        message={`${evrak?.evrak_sayi || "Bu evrak"} kaydını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
