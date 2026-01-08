"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

// Schema
const formSchema = z.object({
    ad_soyad: z.string().min(1, "Ad soyad gerekli"),
    kurum: z.string().min(1, "Kurum adı gerekli"),
    unvan: z.string().optional(),
    iletisim: z.string().optional(),
    tarih: z.string().min(1, "Tarih gerekli"),
    saat: z.string().min(1, "Saat gerekli"),
    amac: z.string().optional(),
    notlar: z.string().optional(),
    durum: z.string().optional().default("Bekliyor"),
});

type FormValues = z.infer<typeof formSchema>;

interface RandevuDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function RandevuDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: RandevuDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            durum: "Bekliyor",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                // Reset form with initial data
                const formattedDate = initialData.tarih ? new Date(initialData.tarih).toISOString().split('T')[0] : '';
                reset({
                    ad_soyad: initialData.ad_soyad,
                    kurum: initialData.kurum,
                    unvan: initialData.unvan || "",
                    iletisim: initialData.iletisim || "",
                    tarih: formattedDate,
                    saat: initialData.saat,
                    amac: initialData.amac || "",
                    notlar: initialData.notlar || "",
                    durum: initialData.durum || "Bekliyor",
                });
            } else {
                // Reset to empty state
                reset({
                    ad_soyad: "",
                    kurum: "",
                    unvan: "",
                    iletisim: "",
                    tarih: new Date().toISOString().split('T')[0],
                    saat: "09:00",
                    amac: "",
                    notlar: "",
                    durum: "Bekliyor",
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData
                ? `/api/randevu/${initialData.id}`
                : "/api/randevu";

            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("İşlem başarısız");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            alert("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title={initialData ? "Randevu Düzenle" : "Yeni Randevu"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Ad Soyad"
                        {...register("ad_soyad")}
                        error={errors.ad_soyad?.message}
                        placeholder="Örn: Ahmet Yılmaz"
                    />
                    <Input
                        label="Kurum"
                        {...register("kurum")}
                        error={errors.kurum?.message}
                        placeholder="Örn: İl Sağlık Müdürlüğü"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Ünvan"
                        {...register("unvan")}
                        placeholder="Örn: Müdür"
                    />
                    <Input
                        label="İletişim"
                        {...register("iletisim")}
                        placeholder="Örn: 0555 555 55 55"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Tarih"
                        {...register("tarih")}
                        error={errors.tarih?.message}
                    />
                    <Input
                        type="time"
                        label="Saat"
                        {...register("saat")}
                        error={errors.saat?.message}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Konu / Amaç</label>
                    <textarea
                        {...register("amac")}
                        className="w-full min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Randevu konusu..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Notlar</label>
                    <textarea
                        {...register("notlar")}
                        className="w-full min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Özel notlar..."
                    />
                </div>

                <Select
                    label="Durum"
                    {...register("durum")}
                    options={[
                        { value: "Bekliyor", label: "Bekliyor" },
                        { value: "Onaylandı", label: "Onaylandı" },
                        { value: "İptal", label: "İptal" },
                        { value: "Tamamlandı", label: "Tamamlandı" },
                    ]}
                />

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {initialData ? "Güncelle" : "Kaydet"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
