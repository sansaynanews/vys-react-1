"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SalonRezarvasyon {
  id: number;
  salon_id: number;
  salon_ad: string | null;
  baslik: string | null;
  tur: string | null;
  rez_sahibi: string | null;
  departman: string | null;
  iletisim: string | null;
  tarih: string | null;
  bas_saat: string | null;
  bit_saat: string | null;
  tekrar_tipi: string | null;
  kararlar: string | null;
}

interface SalonRezervasyonModalProps {
  rezervasyon: SalonRezarvasyon | null;
  onClose: (refresh?: boolean) => void;
}

export function SalonRezervasyonModal({ rezervasyon, onClose }: SalonRezervasyonModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    salon_id: "1",
    salon_ad: "",
    baslik: "",
    tur: "Toplantı",
    rez_sahibi: "",
    departman: "",
    iletisim: "",
    tarih: "",
    bas_saat: "",
    bit_saat: "",
    tekrar_tipi: "yok",
    kararlar: "",
  });

  useEffect(() => {
    if (rezervasyon) {
      setFormData({
        salon_id: rezervasyon.salon_id.toString(),
        salon_ad: rezervasyon.salon_ad || "",
        baslik: rezervasyon.baslik || "",
        tur: rezervasyon.tur || "Toplantı",
        rez_sahibi: rezervasyon.rez_sahibi || "",
        departman: rezervasyon.departman || "",
        iletisim: rezervasyon.iletisim || "",
        tarih: rezervasyon.tarih || "",
        bas_saat: rezervasyon.bas_saat || "",
        bit_saat: rezervasyon.bit_saat || "",
        tekrar_tipi: rezervasyon.tekrar_tipi || "yok",
        kararlar: rezervasyon.kararlar || "",
      });
    }
  }, [rezervasyon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        salon_id: parseInt(formData.salon_id),
      };

      const url = rezervasyon ? `/api/salon-rezervasyon/${rezervasyon.id}` : "/api/salon-rezervasyon";
      const method = rezervasyon ? "PUT" : "POST";

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
    if (!rezervasyon) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/salon-rezervasyon/${rezervasyon.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={rezervasyon ? "Rezervasyon Düzenle" : "Yeni Rezervasyon"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Salon Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Salon ID"
                type="number"
                required
                value={formData.salon_id}
                onChange={(e) => setFormData({ ...formData, salon_id: e.target.value })}
                placeholder="1"
              />
              <Input
                label="Salon Adı"
                value={formData.salon_ad}
                onChange={(e) => setFormData({ ...formData, salon_ad: e.target.value })}
                placeholder="Vali Toplantı Salonu"
              />
            </div>

            {/* Rezervasyon Bilgileri */}
            <Input
              label="Başlık"
              value={formData.baslik}
              onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
              placeholder="Aylık Koordinasyon Toplantısı"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tür"
                value={formData.tur}
                onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
              >
                <option value="Toplantı">Toplantı</option>
                <option value="Eğitim">Eğitim</option>
                <option value="Seminer">Seminer</option>
                <option value="Konferans">Konferans</option>
                <option value="Diğer">Diğer</option>
              </Select>

              <Select
                label="Tekrar Tipi"
                value={formData.tekrar_tipi}
                onChange={(e) => setFormData({ ...formData, tekrar_tipi: e.target.value })}
              >
                <option value="yok">Tekil</option>
                <option value="gunluk">Günlük</option>
                <option value="haftalik">Haftalık</option>
                <option value="aylik">Aylık</option>
              </Select>
            </div>

            {/* Rezervasyon Sahibi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Rezervasyon Sahibi"
                value={formData.rez_sahibi}
                onChange={(e) => setFormData({ ...formData, rez_sahibi: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
              <Input
                label="Departman"
                value={formData.departman}
                onChange={(e) => setFormData({ ...formData, departman: e.target.value })}
                placeholder="İdari İşler Müdürlüğü"
              />
            </div>

            <Input
              label="İletişim"
              value={formData.iletisim}
              onChange={(e) => setFormData({ ...formData, iletisim: e.target.value })}
              placeholder="0555 123 45 67"
            />

            {/* Tarih ve Saat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Tarih"
                type="date"
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
              />
              <Input
                label="Başlangıç Saati"
                type="time"
                value={formData.bas_saat}
                onChange={(e) => setFormData({ ...formData, bas_saat: e.target.value })}
              />
              <Input
                label="Bitiş Saati"
                type="time"
                value={formData.bit_saat}
                onChange={(e) => setFormData({ ...formData, bit_saat: e.target.value })}
              />
            </div>

            <Textarea
              label="Kararlar/Notlar"
              value={formData.kararlar}
              onChange={(e) => setFormData({ ...formData, kararlar: e.target.value })}
              placeholder="Toplantı kararları ve notlar..."
              rows={6}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {rezervasyon ? (
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
                {rezervasyon ? "Güncelle" : "Oluştur"}
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
        title="Rezervasyon Kaydını Sil"
        message={`${rezervasyon?.baslik} - ${rezervasyon?.tarih} tarihli rezervasyonu silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
