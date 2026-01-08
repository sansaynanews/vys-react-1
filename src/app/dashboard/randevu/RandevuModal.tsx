"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Trash2, UserPlus, X, Phone, Building2, User, Clock, Calendar as CalendarIcon, FileText } from "lucide-react";
import { useToastStore } from "@/hooks/useToastStore";

// Modern Calendar imports
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";

const randevuSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  kurum: z.string().min(1, "Kurum gerekli"),
  unvan: z.string().optional(),
  telefon: z.string().optional(), // We'll handle masking manually
  konu: z.string().optional(),
  tarih: z.date(),
  saat: z.string().min(1, "Saat gerekli"),
  notlar: z.string().optional(),
  konuklar: z.array(z.object({ ad: z.string() })).optional(),
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
    control,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<RandevuFormData>({
    defaultValues: {
      ad_soyad: "",
      kurum: "",
      unvan: "",
      telefon: "",
      konu: "",
      tarih: new Date(), // Default to Today
      saat: "",
      notlar: "",
      konuklar: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "konuklar",
  });

  const selectedDate = watch("tarih");

  useEffect(() => {
    if (randevu) {
      // Parse notes to extract guest names if possible, or just leave them in notes
      // For now, we won't try to parse back from notes to dynamic fields to avoid data loss/confusion
      // We'll just load the main data
      reset({
        ad_soyad: randevu.ad_soyad || "",
        kurum: randevu.kurum || "",
        unvan: randevu.unvan || "",
        telefon: randevu.iletisim || "", // Map iletisim to telefon
        konu: randevu.amac || "", // Map amac to konu
        tarih: randevu.tarih ? new Date(randevu.tarih) : undefined,
        saat: randevu.saat || "",
        notlar: randevu.notlar || "",
        konuklar: []
      });
    } else {
      reset({
        ad_soyad: "",
        kurum: "",
        unvan: "",
        telefon: "",
        konu: "",
        tarih: new Date(), // Default to Today
        saat: "",
        notlar: "",
        konuklar: []
      });
    }
  }, [randevu, reset]);

  // Phone masking handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Ensure it starts with 5 (since 0 is fixed outside)
    if (value.length > 0 && value[0] === '0') value = value.substring(1);

    // Limit to 10 digits
    if (value.length > 10) value = value.substring(0, 10);

    // Format: 5XX-XXX-XX-XX
    let formatted = value;
    if (value.length > 3) formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
    if (value.length > 6) formatted = `${formatted.slice(0, 7)}-${value.slice(6)}`;
    if (value.length > 8) formatted = `${formatted.slice(0, 10)}-${value.slice(8)}`;

    setValue("telefon", formatted);
  };

  const onSubmit = async (data: RandevuFormData) => {
    try {
      setLoading(true);

      const url = randevu ? `/api/randevu/${randevu.id}` : "/api/randevu";
      const method = randevu ? "PUT" : "POST";

      // Process guests
      let finalNotes = data.notlar || "";
      let participantCount = 1;

      if (data.konuklar && data.konuklar.length > 0) {
        participantCount += data.konuklar.length;
        const guestNames = data.konuklar.map(k => k.ad).filter(n => n.trim() !== "").join(", ");
        if (guestNames) {
          finalNotes = finalNotes ? `${finalNotes}\n\nDiğer Katılımcılar: ${guestNames}` : `Diğer Katılımcılar: ${guestNames}`;
        }
      }

      // Format phone with leading 0
      const formattedPhone = data.telefon ? `0${data.telefon.replace(/-/g, '')}` : "";

      // Format date for API (YYYY-MM-DD)
      const formattedDate = format(data.tarih, "yyyy-MM-dd");

      const payload = {
        ad_soyad: data.ad_soyad,
        kurum: data.kurum,
        unvan: data.unvan,
        iletisim: formattedPhone, // Send full number
        amac: data.konu,
        tarih: formattedDate,
        saat: data.saat,
        durum: randevu?.durum || "Bekliyor", // Preserve existing or default
        notlar: finalNotes,
        katilimci: participantCount,
        tipi: "Randevu"
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      const response = await fetch(`/api/randevu/${randevu.id}`, { method: "DELETE" });
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
      <Modal
        open={open}
        onClose={onClose}
        title={randevu ? "Randevu Düzenle" : "Yeni Randevu Oluştur"}
        size="lg" // Make modal larger
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">

          {/* Main Info Section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Kişi & Kurum Bilgileri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Talep Eden Ad Soyad <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Örn: Ahmet Yılmaz"
                  {...register("ad_soyad")}
                  error={errors.ad_soyad?.message}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kurum <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Örn: Valilik Makamı"
                    {...register("kurum")}
                    error={errors.kurum?.message}
                    className="bg-white pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Ünvan</label>
                <Input
                  placeholder="Örn: İl Müdürü"
                  {...register("unvan")}
                  error={errors.unvan?.message}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Telefon</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 top-2.5 flex items-center gap-2 border-r border-slate-200 pr-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500 font-medium text-sm">0</span>
                  </div>
                  <Input
                    placeholder="5XX-XXX-XX-XX"
                    {...register("telefon")}
                    onChange={handlePhoneChange}
                    error={errors.telefon?.message}
                    className="bg-white pl-16 font-mono"
                    maxLength={13}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Zamanlama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tarih <span className="text-red-500">*</span></label>
                {/* Modern Calendar using Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white h-11",
                        !selectedDate && "text-muted-foreground",
                        errors.tarih && "border-red-500 ring-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setValue("tarih", date as Date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.tarih && <p className="text-xs text-red-500 mt-1">{errors.tarih.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Saat <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <Input
                    type="time"
                    {...register("saat")}
                    error={errors.saat?.message}
                    className="bg-white pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Guests Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600" />
                Diğer Katılımcılar
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ ad: "" })}
                className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 h-8"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Kişi Ekle
              </Button>
            </div>

            {fields.length > 0 && (
              <div className="bg-sky-50 p-4 rounded-xl space-y-3 border border-sky-100">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder={`${index + 1}. Katılımcı Adı Soyadı`}
                      {...register(`konuklar.${index}.ad` as const)}
                      className="bg-white border-sky-200 focus:border-sky-300 focus:ring-sky-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Konu</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Randevu konusu..."
                  {...register("konu")}
                  error={errors.konu?.message}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Notlar</label>
              <Textarea
                placeholder="Varsa ek notlar..."
                {...register("notlar")}
                error={errors.notlar?.message}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
            {randevu ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
                className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Kaydı Sil
              </Button>
            ) : <div></div>}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="text-slate-500 hover:text-slate-700"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 px-8"
              >
                {randevu ? "Güncelle" : "Randevu Oluştur"}
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
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
