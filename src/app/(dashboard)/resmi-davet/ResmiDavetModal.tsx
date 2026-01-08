"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ResmiDavet {
  id: number;
  tur: string | null;
  sahip: string | null;
  tarih: string | null;
  saat: string | null;
  yer: string | null;
  aciklama: string | null;
  getiren: string | null;
  gelis_sekli: string | null;
  iletisim: string | null;
  gelis_tarih: string | null;
  gelis_saat: string | null;
  katilim_durumu: string | null;
}

interface ResmiDavetModalProps {
  davet: ResmiDavet | null;
  onClose: (refresh?: boolean) => void;
}

export function ResmiDavetModal({ davet, onClose }: ResmiDavetModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    tur: "Resmi Tören",
    sahip: "",
    tarih: "",
    saat: "",
    yer: "",
    aciklama: "",
    getiren: "",
    gelis_sekli: "",
    iletisim: "",
    gelis_tarih: "",
    gelis_saat: "",
    katilim_durumu: "Belirsiz",
  });

  useEffect(() => {
    if (davet) {
      setFormData({
        tur: davet.tur || "Resmi Tören",
        sahip: davet.sahip || "",
        tarih: davet.tarih || "",
        saat: davet.saat || "",
        yer: davet.yer || "",
        aciklama: davet.aciklama || "",
        getiren: davet.getiren || "",
        gelis_sekli: davet.gelis_sekli || "",
        iletisim: davet.iletisim || "",
        gelis_tarih: davet.gelis_tarih || "",
        gelis_saat: davet.gelis_saat || "",
        katilim_durumu: davet.katilim_durumu || "Belirsiz",
      });
    }
  }, [davet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = davet ? `/api/resmi-davet/${davet.id}` : "/api/resmi-davet";
      const method = davet ? "PUT" : "POST";

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
    if (!davet) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/resmi-davet/${davet.id}`, {
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
      <Modal open={true} onClose={() => onClose()} title={davet ? "Davet Düzenle" : "Yeni Davet"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Davet Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Davet Türü"
                value={formData.tur}
                onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
              >
                <option value="Resmi Tören">Resmi Tören</option>
                <option value="Kokteyl">Kokteyl</option>
                <option value="Yemek">Yemek</option>
                <option value="Toplantı">Toplantı</option>
                <option value="Açılış">Açılış</option>
                <option value="Diğer">Diğer</option>
              </Select>
              <Input
                label="Davet Sahibi"
                required
                value={formData.sahip}
                onChange={(e) => setFormData({ ...formData, sahip: e.target.value })}
                placeholder="Ankara Büyükşehir Belediyesi"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Davet Tarihi"
                type="date"
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
              />
              <Input
                label="Davet Saati"
                type="time"
                value={formData.saat}
                onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
              />
            </div>

            <Input
              label="Yer"
              value={formData.yer}
              onChange={(e) => setFormData({ ...formData, yer: e.target.value })}
              placeholder="Kongre Merkezi, Salon A"
            />

            <Textarea
              label="Açıklama"
              value={formData.aciklama}
              onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
              placeholder="Davet detayları..."
              rows={3}
            />

            {/* Getiren Bilgileri */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Davet Ulaştırma Bilgileri</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Daveti Getiren"
                    value={formData.getiren}
                    onChange={(e) => setFormData({ ...formData, getiren: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                  />
                  <Select
                    label="Geliş Şekli"
                    value={formData.gelis_sekli}
                    onChange={(e) => setFormData({ ...formData, gelis_sekli: e.target.value })}
                  >
                    <option value="">Seçiniz...</option>
                    <option value="Elden">Elden</option>
                    <option value="Kargo">Kargo</option>
                    <option value="E-posta">E-posta</option>
                    <option value="Diğer">Diğer</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="İletişim"
                    value={formData.iletisim}
                    onChange={(e) => setFormData({ ...formData, iletisim: e.target.value })}
                    placeholder="0555 123 45 67"
                  />
                  <Input
                    label="Geliş Tarihi"
                    type="date"
                    value={formData.gelis_tarih}
                    onChange={(e) => setFormData({ ...formData, gelis_tarih: e.target.value })}
                  />
                  <Input
                    label="Geliş Saati"
                    type="time"
                    value={formData.gelis_saat}
                    onChange={(e) => setFormData({ ...formData, gelis_saat: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Katılım Durumu */}
            <Select
              label="Katılım Durumu"
              value={formData.katilim_durumu}
              onChange={(e) => setFormData({ ...formData, katilim_durumu: e.target.value })}
            >
              <option value="Belirsiz">Belirsiz</option>
              <option value="Katılacak">Katılacak</option>
              <option value="Katılmayacak">Katılmayacak</option>
            </Select>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {davet ? (
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
                {davet ? "Güncelle" : "Oluştur"}
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
        title="Davet Kaydını Sil"
        message={`${davet?.sahip} - ${davet?.tarih} tarihli daveti silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
