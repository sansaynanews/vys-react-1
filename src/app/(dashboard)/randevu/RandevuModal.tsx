"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DateInput } from "@/components/ui/DateInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
import { useToastStore } from "@/hooks/useToastStore";

const randevuSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  kurum: z.string().min(1, "Kurum gerekli"),
  unvan: z.string().optional(),
  telefon: z.string().optional(),
  konu: z.string().optional(),
  tarih: z.string().min(1, "Tarih gerekli"),
  saat: z.string().min(1, "Saat gerekli"),
  durum: z.string().optional(),
  notlar: z.string().optional(),
  salon: z.string().optional(),
});

type RandevuFormData = z.infer<typeof randevuSchema>;

interface RandevuModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  randevu?: any;
}

export default function RandevuModal({
  open,
  onClose,
  onSuccess,
  randevu,
}: RandevuModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { showToast } = useToastStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RandevuFormData>({
    defaultValues: randevu
      ? {
          ad_soyad: randevu.ad_soyad || "",
          kurum: randevu.kurum || "",
          unvan: randevu.unvan || "",
          telefon: randevu.telefon || "",
          konu: randevu.konu || "",
          tarih: randevu.tarih || "",
          saat: randevu.saat || "",
          durum: randevu.durum || "Bekliyor",
          notlar: randevu.notlar || "",
          salon: randevu.salon || "",
        }
      : {
          durum: "Bekliyor",
        },
  });

  useEffect(() => {
    if (randevu) {
      reset({
        ad_soyad: randevu.ad_soyad || "",
        kurum: randevu.kurum || "",
        unvan: randevu.unvan || "",
        telefon: randevu.telefon || "",
        konu: randevu.konu || "",
        tarih: randevu.tarih || "",
        saat: randevu.saat || "",
        durum: randevu.durum || "Bekliyor",
        notlar: randevu.notlar || "",
        salon: randevu.salon || "",
      });
    }
  }, [randevu, reset]);

  const onSubmit = async (data: RandevuFormData) => {
    try {
      setLoading(true);

      const url = randevu ? `/api/randevu/${randevu.id}` : "/api/randevu";
      const method = randevu ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "İşlem başarısız");
      }

      showToast(
        randevu ? "Randevu başarıyla güncellendi" : "Randevu başarıyla oluşturuldu",
        "success"
      );
      onSuccess();
    } catch (error: any) {
      showToast(error.message || "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/randevu/${randevu.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Silme işlemi başarısız");
      }

      showToast("Randevu başarıyla silindi", "success");
      onSuccess();
    } catch (error: any) {
      showToast(error.message || "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={randevu ? "Randevu Düzenle" : "Yeni Randevu"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ad Soyad"
              {...register("ad_soyad")}
              error={errors.ad_soyad?.message}
              required
            />
            <Input
              label="Kurum"
              {...register("kurum")}
              error={errors.kurum?.message}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ünvan"
              {...register("unvan")}
              error={errors.unvan?.message}
            />
            <Input
              label="Telefon"
              {...register("telefon")}
              error={errors.telefon?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateInput
              label="Tarih"
              {...register("tarih")}
              error={errors.tarih?.message}
              required
            />
            <Input
              label="Saat"
              type="time"
              {...register("saat")}
              error={errors.saat?.message}
              required
            />
            <Select
              label="Durum"
              {...register("durum")}
              error={errors.durum?.message}
              options={[
                { value: "Bekliyor", label: "Bekliyor" },
                { value: "Onaylandı", label: "Onaylandı" },
                { value: "Tamamlandı", label: "Tamamlandı" },
                { value: "Görüşüldü", label: "Görüşüldü" },
                { value: "İptal", label: "İptal" },
              ]}
            />
          </div>

          <Input
            label="Salon"
            {...register("salon")}
            error={errors.salon?.message}
          />

          <Textarea
            label="Konu"
            {...register("konu")}
            error={errors.konu?.message}
            rows={3}
          />

          <Textarea
            label="Notlar"
            {...register("notlar")}
            error={errors.notlar?.message}
            rows={3}
          />

          <div className="flex items-center justify-between pt-4 border-t">
            {randevu && (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                Sil
              </Button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                İptal
              </Button>
              <Button type="submit" loading={loading} disabled={loading}>
                {randevu ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Randevuyu Sil"
        message="Bu randevuyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
