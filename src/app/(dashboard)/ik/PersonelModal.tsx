"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Personel {
  id: number;
  birim: string;
  ad_soyad: string;
  unvan?: string | null;
  telefon?: string | null;
  eposta?: string | null;
  acil_kisi?: string | null;
  acil_tel?: string | null;
  kan_grubu?: string | null;
  baslama_tarihi?: string | null;
  yabanci_dil?: string | null;
  gorev_tanimi?: string | null;
  aciklama?: string | null;
  toplam_izin?: number | null;
  kullanilan_izin?: number | null;
  mesai_saati?: number | null;
  rapor_gun?: number | null;
}

interface PersonelModalProps {
  personel: Personel | null;
  onClose: (refresh?: boolean) => void;
}

export function PersonelModal({ personel, onClose }: PersonelModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"genel" | "iletisim" | "izin">("genel");
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    birim: "",
    ad_soyad: "",
    unvan: "",
    telefon: "",
    eposta: "",
    acil_kisi: "",
    acil_tel: "",
    kan_grubu: "",
    baslama_tarihi: "",
    yabanci_dil: "",
    gorev_tanimi: "",
    aciklama: "",
    toplam_izin: "14",
    kullanilan_izin: "0",
    mesai_saati: "0",
    rapor_gun: "0",
  });

  useEffect(() => {
    if (personel) {
      setFormData({
        birim: personel.birim || "",
        ad_soyad: personel.ad_soyad || "",
        unvan: personel.unvan || "",
        telefon: personel.telefon || "",
        eposta: personel.eposta || "",
        acil_kisi: personel.acil_kisi || "",
        acil_tel: personel.acil_tel || "",
        kan_grubu: personel.kan_grubu || "",
        baslama_tarihi: personel.baslama_tarihi || "",
        yabanci_dil: personel.yabanci_dil || "",
        gorev_tanimi: personel.gorev_tanimi || "",
        aciklama: personel.aciklama || "",
        toplam_izin: personel.toplam_izin?.toString() || "14",
        kullanilan_izin: personel.kullanilan_izin?.toString() || "0",
        mesai_saati: personel.mesai_saati?.toString() || "0",
        rapor_gun: personel.rapor_gun?.toString() || "0",
      });
    }
  }, [personel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        toplam_izin: parseInt(formData.toplam_izin) || 14,
        kullanilan_izin: parseInt(formData.kullanilan_izin) || 0,
        mesai_saati: parseFloat(formData.mesai_saati) || 0,
        rapor_gun: parseInt(formData.rapor_gun) || 0,
      };

      const url = personel ? `/api/personel/${personel.id}` : "/api/personel";
      const method = personel ? "PUT" : "POST";

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
    if (!personel) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/personel/${personel.id}`, {
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

  const tabs = [
    { key: "genel", label: "Genel Bilgiler" },
    { key: "iletisim", label: "İletişim & Acil Durum" },
    { key: "izin", label: "İzin & Mesai" },
  ];

  return (
    <>
      <Modal open={true} onClose={() => onClose()} title={personel ? "Personel Düzenle" : "Yeni Personel"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
            {/* Genel Bilgiler Tab */}
            {activeTab === "genel" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ad Soyad"
                    required
                    value={formData.ad_soyad}
                    onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                  />
                  <Select
                    label="Birim"
                    required
                    value={formData.birim}
                    onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Özel Kalem">Özel Kalem</option>
                    <option value="Strateji Geliştirme">Strateji Geliştirme</option>
                    <option value="İnsan Kaynakları">İnsan Kaynakları</option>
                    <option value="Hukuk">Hukuk</option>
                    <option value="Mali Hizmetler">Mali Hizmetler</option>
                    <option value="Basın ve Halkla İlişkiler">Basın ve Halkla İlişkiler</option>
                    <option value="Bilgi İşlem">Bilgi İşlem</option>
                    <option value="Destek Hizmetleri">Destek Hizmetleri</option>
                  </Select>
                  <Input
                    label="Ünvan"
                    value={formData.unvan}
                    onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                    placeholder="Vali Yardımcısı"
                  />
                  <DateInput
                    label="Başlama Tarihi"
                    value={formData.baslama_tarihi}
                    onChange={(e) => setFormData({ ...formData, baslama_tarihi: e.target.value })}
                  />
                  <Select
                    label="Kan Grubu"
                    value={formData.kan_grubu}
                    onChange={(e) => setFormData({ ...formData, kan_grubu: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    <option value="A Rh+">A Rh+</option>
                    <option value="A Rh-">A Rh-</option>
                    <option value="B Rh+">B Rh+</option>
                    <option value="B Rh-">B Rh-</option>
                    <option value="AB Rh+">AB Rh+</option>
                    <option value="AB Rh-">AB Rh-</option>
                    <option value="0 Rh+">0 Rh+</option>
                    <option value="0 Rh-">0 Rh-</option>
                  </Select>
                  <Input
                    label="Yabancı Dil"
                    value={formData.yabanci_dil}
                    onChange={(e) => setFormData({ ...formData, yabanci_dil: e.target.value })}
                    placeholder="İngilizce (İleri Düzey)"
                  />
                </div>
                <Textarea
                  label="Görev Tanımı"
                  value={formData.gorev_tanimi}
                  onChange={(e) => setFormData({ ...formData, gorev_tanimi: e.target.value })}
                  placeholder="Personelin görev ve sorumlulukları..."
                  rows={3}
                />
                <Textarea
                  label="Açıklama"
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  placeholder="Ek notlar..."
                  rows={2}
                />
              </div>
            )}

            {/* İletişim Tab */}
            {activeTab === "iletisim" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Telefon"
                    type="tel"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="0555 123 4567"
                  />
                  <Input
                    label="E-posta"
                    type="email"
                    value={formData.eposta}
                    onChange={(e) => setFormData({ ...formData, eposta: e.target.value })}
                    placeholder="ahmet.yilmaz@valilik.gov.tr"
                  />
                  <Input
                    label="Acil Durum Kişisi"
                    value={formData.acil_kisi}
                    onChange={(e) => setFormData({ ...formData, acil_kisi: e.target.value })}
                    placeholder="Ayşe Yılmaz"
                  />
                  <Input
                    label="Acil Durum Telefonu"
                    type="tel"
                    value={formData.acil_tel}
                    onChange={(e) => setFormData({ ...formData, acil_tel: e.target.value })}
                    placeholder="0555 987 6543"
                  />
                </div>
              </div>
            )}

            {/* İzin & Mesai Tab */}
            {activeTab === "izin" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Toplam İzin Hakkı (Gün)"
                    type="number"
                    value={formData.toplam_izin}
                    onChange={(e) => setFormData({ ...formData, toplam_izin: e.target.value })}
                    placeholder="14"
                  />
                  <Input
                    label="Kullanılan İzin (Gün)"
                    type="number"
                    value={formData.kullanilan_izin}
                    onChange={(e) => setFormData({ ...formData, kullanilan_izin: e.target.value })}
                    placeholder="0"
                    disabled={!personel}
                    helperText={!personel ? "İzin kullanımı izin modülünden takip edilir" : ""}
                  />
                  <Input
                    label="Mesai Saati"
                    type="number"
                    step="0.5"
                    value={formData.mesai_saati}
                    onChange={(e) => setFormData({ ...formData, mesai_saati: e.target.value })}
                    placeholder="0"
                    helperText="Birikmiş mesai saati"
                  />
                  <Input
                    label="Rapor Günü"
                    type="number"
                    value={formData.rapor_gun}
                    onChange={(e) => setFormData({ ...formData, rapor_gun: e.target.value })}
                    placeholder="0"
                    helperText="Toplam rapor günü"
                  />
                </div>
                {personel && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-800">
                      <div className="font-medium mb-2">İzin Özeti</div>
                      <div className="space-y-1">
                        <div>Toplam İzin Hakkı: <span className="font-medium">{formData.toplam_izin} gün</span></div>
                        <div>Kullanılan: <span className="font-medium">{formData.kullanilan_izin} gün</span></div>
                        <div>Kalan: <span className="font-medium text-green-700">{parseInt(formData.toplam_izin) - parseInt(formData.kullanilan_izin)} gün</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {personel ? (
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
                {personel ? "Güncelle" : "Oluştur"}
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
        title="Personeli Sil"
        message={`${personel?.ad_soyad} isimli personeli silmek istediğinizden emin misiniz? Bu işlem personeli pasif hale getirir.`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
