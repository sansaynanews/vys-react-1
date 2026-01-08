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

interface Arac {
  id: number;
  plaka: string;
  marka: string;
  model?: string | null;
  model_yili?: number | null;
  ruhsat_seri?: string | null;
  lastik_ebat?: string | null;
  renk?: string | null;
  tur?: string | null;
  yakit?: string | null;
  kurum?: string | null;
  bakim_son?: string | null;
  bakim_sonraki?: string | null;
  sigorta_bas?: string | null;
  sigorta_bit?: string | null;
  kasko_bas?: string | null;
  kasko_bit?: string | null;
  muayene_tarih?: string | null;
  muayene_bit?: string | null;
  bakim_son_km?: number | null;
  bakim_sonraki_km?: number | null;
  lastik_degisim_tarih?: string | null;
  lastik_yili?: string | null;
  periyodik_bakim_tarih?: string | null;
  periyodik_bakim_km?: number | null;
  agir_bakim_tarih?: string | null;
  agir_bakim_km?: number | null;
  diger_aciklama?: string | null;
  diger_tarih?: string | null;
  diger_km?: number | null;
}

interface AracModalProps {
  arac: Arac | null;
  onClose: (refresh?: boolean) => void;
}

export function AracModal({ arac, onClose }: AracModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"genel" | "sigorta" | "bakim" | "diger">("genel");
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    plaka: "",
    marka: "",
    model: "",
    model_yili: "",
    ruhsat_seri: "",
    lastik_ebat: "",
    renk: "",
    tur: "",
    yakit: "",
    kurum: "",
    bakim_son: "",
    bakim_sonraki: "",
    sigorta_bas: "",
    sigorta_bit: "",
    kasko_bas: "",
    kasko_bit: "",
    muayene_tarih: "",
    muayene_bit: "",
    bakim_son_km: "",
    bakim_sonraki_km: "",
    lastik_degisim_tarih: "",
    lastik_yili: "",
    periyodik_bakim_tarih: "",
    periyodik_bakim_km: "",
    agir_bakim_tarih: "",
    agir_bakim_km: "",
    diger_aciklama: "",
    diger_tarih: "",
    diger_km: "",
  });

  useEffect(() => {
    if (arac) {
      setFormData({
        plaka: arac.plaka || "",
        marka: arac.marka || "",
        model: arac.model || "",
        model_yili: arac.model_yili?.toString() || "",
        ruhsat_seri: arac.ruhsat_seri || "",
        lastik_ebat: arac.lastik_ebat || "",
        renk: arac.renk || "",
        tur: arac.tur || "",
        yakit: arac.yakit || "",
        kurum: arac.kurum || "",
        bakim_son: arac.bakim_son || "",
        bakim_sonraki: arac.bakim_sonraki || "",
        sigorta_bas: arac.sigorta_bas || "",
        sigorta_bit: arac.sigorta_bit || "",
        kasko_bas: arac.kasko_bas || "",
        kasko_bit: arac.kasko_bit || "",
        muayene_tarih: arac.muayene_tarih || "",
        muayene_bit: arac.muayene_bit || "",
        bakim_son_km: arac.bakim_son_km?.toString() || "",
        bakim_sonraki_km: arac.bakim_sonraki_km?.toString() || "",
        lastik_degisim_tarih: arac.lastik_degisim_tarih || "",
        lastik_yili: arac.lastik_yili || "",
        periyodik_bakim_tarih: arac.periyodik_bakim_tarih || "",
        periyodik_bakim_km: arac.periyodik_bakim_km?.toString() || "",
        agir_bakim_tarih: arac.agir_bakim_tarih || "",
        agir_bakim_km: arac.agir_bakim_km?.toString() || "",
        diger_aciklama: arac.diger_aciklama || "",
        diger_tarih: arac.diger_tarih || "",
        diger_km: arac.diger_km?.toString() || "",
      });
    }
  }, [arac]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        model_yili: formData.model_yili ? parseInt(formData.model_yili) : undefined,
        bakim_son_km: formData.bakim_son_km ? parseInt(formData.bakim_son_km) : undefined,
        bakim_sonraki_km: formData.bakim_sonraki_km ? parseInt(formData.bakim_sonraki_km) : undefined,
        periyodik_bakim_km: formData.periyodik_bakim_km ? parseInt(formData.periyodik_bakim_km) : undefined,
        agir_bakim_km: formData.agir_bakim_km ? parseInt(formData.agir_bakim_km) : undefined,
        diger_km: formData.diger_km ? parseInt(formData.diger_km) : undefined,
      };

      const url = arac ? `/api/arac/${arac.id}` : "/api/arac";
      const method = arac ? "PUT" : "POST";

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
    if (!arac) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/arac/${arac.id}`, {
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
    { key: "sigorta", label: "Sigorta/Muayene" },
    { key: "bakim", label: "Bakım/Lastik" },
    { key: "diger", label: "Diğer" },
  ];

  return (
    <>
      <Modal open={true} onClose={() => onClose()} title={arac ? "Araç Düzenle" : "Yeni Araç"}>
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
                    label="Plaka"
                    required
                    value={formData.plaka}
                    onChange={(e) => setFormData({ ...formData, plaka: e.target.value })}
                    placeholder="34 ABC 123"
                  />
                  <Input
                    label="Marka"
                    required
                    value={formData.marka}
                    onChange={(e) => setFormData({ ...formData, marka: e.target.value })}
                    placeholder="Toyota"
                  />
                  <Input
                    label="Model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Corolla"
                  />
                  <Input
                    label="Model Yılı"
                    type="number"
                    value={formData.model_yili}
                    onChange={(e) => setFormData({ ...formData, model_yili: e.target.value })}
                    placeholder="2023"
                  />
                  <Input
                    label="Ruhsat Seri No"
                    value={formData.ruhsat_seri}
                    onChange={(e) => setFormData({ ...formData, ruhsat_seri: e.target.value })}
                    placeholder="A12B345678"
                  />
                  <Input
                    label="Renk"
                    value={formData.renk}
                    onChange={(e) => setFormData({ ...formData, renk: e.target.value })}
                    placeholder="Beyaz"
                  />
                  <Select
                    label="Araç Türü"
                    value={formData.tur}
                    onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Binek">Binek</option>
                    <option value="Ticari">Ticari</option>
                    <option value="Kamyonet">Kamyonet</option>
                    <option value="Minibüs">Minibüs</option>
                    <option value="Otobüs">Otobüs</option>
                  </Select>
                  <Select
                    label="Yakıt Türü"
                    value={formData.yakit}
                    onChange={(e) => setFormData({ ...formData, yakit: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Benzin">Benzin</option>
                    <option value="Dizel">Dizel</option>
                    <option value="LPG">LPG</option>
                    <option value="Elektrik">Elektrik</option>
                    <option value="Hibrit">Hibrit</option>
                  </Select>
                  <Select
                    label="Kurum"
                    value={formData.kurum}
                    onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Valilik">Valilik</option>
                    <option value="Kaymakamlık">Kaymakamlık</option>
                    <option value="Belediye">Belediye</option>
                    <option value="Diğer">Diğer</option>
                  </Select>
                  <Input
                    label="Lastik Ebatı"
                    value={formData.lastik_ebat}
                    onChange={(e) => setFormData({ ...formData, lastik_ebat: e.target.value })}
                    placeholder="205/55 R16"
                  />
                </div>
              </div>
            )}

            {/* Sigorta/Muayene Tab */}
            {activeTab === "sigorta" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateInput
                    label="Sigorta Başlangıç"
                    value={formData.sigorta_bas}
                    onChange={(e) => setFormData({ ...formData, sigorta_bas: e.target.value })}
                  />
                  <DateInput
                    label="Sigorta Bitiş"
                    value={formData.sigorta_bit}
                    onChange={(e) => setFormData({ ...formData, sigorta_bit: e.target.value })}
                  />
                  <DateInput
                    label="Kasko Başlangıç"
                    value={formData.kasko_bas}
                    onChange={(e) => setFormData({ ...formData, kasko_bas: e.target.value })}
                  />
                  <DateInput
                    label="Kasko Bitiş"
                    value={formData.kasko_bit}
                    onChange={(e) => setFormData({ ...formData, kasko_bit: e.target.value })}
                  />
                  <DateInput
                    label="Muayene Tarihi"
                    value={formData.muayene_tarih}
                    onChange={(e) => setFormData({ ...formData, muayene_tarih: e.target.value })}
                  />
                  <DateInput
                    label="Muayene Bitiş"
                    value={formData.muayene_bit}
                    onChange={(e) => setFormData({ ...formData, muayene_bit: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Bakım/Lastik Tab */}
            {activeTab === "bakim" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateInput
                    label="Son Bakım Tarihi"
                    value={formData.bakim_son}
                    onChange={(e) => setFormData({ ...formData, bakim_son: e.target.value })}
                  />
                  <Input
                    label="Son Bakım KM"
                    type="number"
                    value={formData.bakim_son_km}
                    onChange={(e) => setFormData({ ...formData, bakim_son_km: e.target.value })}
                    placeholder="50000"
                  />
                  <Input
                    label="Sonraki Bakım (Açıklama)"
                    value={formData.bakim_sonraki}
                    onChange={(e) => setFormData({ ...formData, bakim_sonraki: e.target.value })}
                    placeholder="5000 km sonra"
                  />
                  <Input
                    label="Sonraki Bakım KM"
                    type="number"
                    value={formData.bakim_sonraki_km}
                    onChange={(e) => setFormData({ ...formData, bakim_sonraki_km: e.target.value })}
                    placeholder="55000"
                  />
                  <DateInput
                    label="Periyodik Bakım Tarihi"
                    value={formData.periyodik_bakim_tarih}
                    onChange={(e) => setFormData({ ...formData, periyodik_bakim_tarih: e.target.value })}
                  />
                  <Input
                    label="Periyodik Bakım KM"
                    type="number"
                    value={formData.periyodik_bakim_km}
                    onChange={(e) => setFormData({ ...formData, periyodik_bakim_km: e.target.value })}
                    placeholder="60000"
                  />
                  <DateInput
                    label="Ağır Bakım Tarihi"
                    value={formData.agir_bakim_tarih}
                    onChange={(e) => setFormData({ ...formData, agir_bakim_tarih: e.target.value })}
                  />
                  <Input
                    label="Ağır Bakım KM"
                    type="number"
                    value={formData.agir_bakim_km}
                    onChange={(e) => setFormData({ ...formData, agir_bakim_km: e.target.value })}
                    placeholder="100000"
                  />
                  <DateInput
                    label="Lastik Değişim Tarihi"
                    value={formData.lastik_degisim_tarih}
                    onChange={(e) => setFormData({ ...formData, lastik_degisim_tarih: e.target.value })}
                  />
                  <Input
                    label="Lastik Yılı"
                    value={formData.lastik_yili}
                    onChange={(e) => setFormData({ ...formData, lastik_yili: e.target.value })}
                    placeholder="2023"
                  />
                </div>
              </div>
            )}

            {/* Diğer Tab */}
            {activeTab === "diger" && (
              <div className="space-y-4">
                <Textarea
                  label="Diğer Açıklama"
                  value={formData.diger_aciklama}
                  onChange={(e) => setFormData({ ...formData, diger_aciklama: e.target.value })}
                  placeholder="Ek notlar ve açıklamalar..."
                  rows={4}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateInput
                    label="Diğer Tarih"
                    value={formData.diger_tarih}
                    onChange={(e) => setFormData({ ...formData, diger_tarih: e.target.value })}
                  />
                  <Input
                    label="Diğer KM"
                    type="number"
                    value={formData.diger_km}
                    onChange={(e) => setFormData({ ...formData, diger_km: e.target.value })}
                    placeholder="Kilometre bilgisi"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            {arac ? (
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
                {arac ? "Güncelle" : "Oluştur"}
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
        title="Aracı Sil"
        message={`${arac?.plaka} plakalı aracı silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        loading={loading}
      />
    </>
  );
}
