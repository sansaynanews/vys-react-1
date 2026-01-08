"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { useToastStore } from "@/hooks/useToastStore";
import dayjs from "dayjs";

interface HareketModalProps {
  onClose: (refresh?: boolean) => void;
}

interface StokKarti {
  id: number;
  adi: string;
  cesit: string;
  miktar: number | null;
}

export function HareketModal({ onClose }: HareketModalProps) {
  const [loading, setLoading] = useState(false);
  const [stokKartlari, setStokKartlari] = useState<StokKarti[]>([]);
  const [selectedStok, setSelectedStok] = useState<StokKarti | null>(null);
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    stok_id: "",
    tur: "giris",
    alinan: "",
    verilen: "",
    miktar: "",
    tarih: dayjs().format("YYYY-MM-DD"),
    saat: dayjs().format("HH:mm"),
    stok_turu: "genel",
  });

  useEffect(() => {
    fetchStokKartlari();
  }, []);

  const fetchStokKartlari = async () => {
    try {
      const response = await fetch("/api/stok?limit=1000");
      const data = await response.json();
      if (response.ok) {
        setStokKartlari(data.data);
      }
    } catch (error) {
      console.error("Stok kartları alınamadı:", error);
    }
  };

  const handleStokChange = (stokId: string) => {
    setFormData({ ...formData, stok_id: stokId });
    const stok = stokKartlari.find((s) => s.id === parseInt(stokId));
    setSelectedStok(stok || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedStok) {
        throw new Error("Lütfen bir stok kartı seçin");
      }

      const miktar = parseInt(formData.miktar);
      if (isNaN(miktar) || miktar <= 0) {
        throw new Error("Geçerli bir miktar giriniz");
      }

      const payload = {
        tur: formData.tur,
        adi: selectedStok.adi,
        cesit: selectedStok.cesit,
        alinan: formData.tur === "giris" ? formData.alinan : undefined,
        verilen: formData.tur === "cikis" ? formData.verilen : undefined,
        miktar: miktar,
        tarih: formData.tarih,
        saat: formData.saat,
        stok_turu: formData.stok_turu,
      };

      const response = await fetch("/api/stok/hareket", {
        method: "POST",
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

  return (
    <Modal open={true} onClose={() => onClose()} title="Yeni Stok Hareketi">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* Stok Kartı Seçimi */}
          <Select
            label="Stok Kartı"
            required
            value={formData.stok_id}
            onChange={(e) => handleStokChange(e.target.value)}
          >
            <option value="">Seçiniz</option>
            {stokKartlari.map((stok) => (
              <option key={stok.id} value={stok.id}>
                {stok.adi} - {stok.cesit} (Mevcut: {stok.miktar || 0})
              </option>
            ))}
          </Select>

          {/* Mevcut Stok Gösterimi */}
          {selectedStok && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <div className="font-medium">Mevcut Stok: {selectedStok.miktar || 0} Adet</div>
              </div>
            </div>
          )}

          {/* İşlem Türü */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="İşlem Türü"
              required
              value={formData.tur}
              onChange={(e) => setFormData({ ...formData, tur: e.target.value })}
            >
              <option value="giris">Giriş (Stok Artışı)</option>
              <option value="cikis">Çıkış (Stok Azalışı)</option>
            </Select>

            <Input
              label="Miktar"
              type="number"
              required
              value={formData.miktar}
              onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
              placeholder="Adet"
            />
          </div>

          {/* Alınan / Verilen */}
          {formData.tur === "giris" ? (
            <Input
              label="Kimden Alındı"
              value={formData.alinan}
              onChange={(e) => setFormData({ ...formData, alinan: e.target.value })}
              placeholder="Tedarikçi adı veya kaynak"
            />
          ) : (
            <Input
              label="Kime Verildi"
              value={formData.verilen}
              onChange={(e) => setFormData({ ...formData, verilen: e.target.value })}
              placeholder="Personel adı veya birim"
            />
          )}

          {/* Tarih ve Saat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateInput
              label="Tarih"
              required
              value={formData.tarih}
              onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
            />
            <Input
              label="Saat"
              type="time"
              value={formData.saat}
              onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
            />
          </div>

          {/* Stok Türü */}
          <Select
            label="Stok Türü"
            value={formData.stok_turu}
            onChange={(e) => setFormData({ ...formData, stok_turu: e.target.value })}
          >
            <option value="genel">Genel</option>
            <option value="ozel">Özel</option>
          </Select>

          {/* Sonuç Gösterimi */}
          {selectedStok && formData.miktar && (
            <div className={`border rounded-lg p-3 ${
              formData.tur === "giris" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
            }`}>
              <div className={`text-sm ${
                formData.tur === "giris" ? "text-green-800" : "text-yellow-800"
              }`}>
                <div className="font-medium mb-1">İşlem Sonucu</div>
                <div>
                  Yeni Stok: {" "}
                  <span className="font-bold">
                    {formData.tur === "giris"
                      ? (selectedStok.miktar || 0) + parseInt(formData.miktar || "0")
                      : (selectedStok.miktar || 0) - parseInt(formData.miktar || "0")
                    } Adet
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center pt-4 border-t gap-2">
          <Button type="button" variant="outline" onClick={() => onClose()} disabled={loading}>
            İptal
          </Button>
          <Button type="submit" loading={loading}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
