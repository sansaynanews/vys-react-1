"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

const formSchema = z.object({
    giris_tarihi: z.string(),
    giris_saati: z.string().min(1, "Saat gerekli"),
    cikis_saati: z.string().optional(),
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    kurum: z.string().optional(),
    unvan: z.string().optional(),
    iletisim: z.string().optional(),
    kisi_sayisi: z.preprocess((val) => Number(val), z.number().min().default(1)),
    diger_kisiler: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ZiyaretciDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function ZiyaretciDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: ZiyaretciDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            giris_tarihi: dayjs().format("YYYY-MM-DD"),
            giris_saati: dayjs().format("HH:mm"),
            kisi_sayisi: 1
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    giris_tarihi: initialData.giris_tarihi ? dayjs(initialData.giris_tarihi).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                });
            } else {
                reset({
                    giris_tarihi: dayjs().format("YYYY-MM-DD"),
                    giris_saati: dayjs().format("HH:mm"),
                    kisi_sayisi: 1
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/ziyaretci/${initialData.id}` : "/api/ziyaretci";
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
            title={initialData ? "Kaydı Düzenle" : "Ziyaretçi Girişi"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <Input type="date" label="Tarih" {...register("giris_tarihi")} />
                    <div className="flex gap-2">
                        <Input type="time" label="Giriş Saati" {...register("giris_saati")} error={errors.giris_saati?.message} />
                        <Input type="time" label="Çıkış Saati" {...register("cikis_saati")} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Ad Soyad" {...register("ad_soyad")} error={errors.ad_soyad?.message} />
                    <Input label="Geldigi Kurum" {...register("kurum")} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Ünvan" {...register("unvan")} />
                    <Input label="İletişim / Tel" {...register("iletisim")} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <Input type="number" label="Kişi Sayısı" {...register("kisi_sayisi")} />
                    </div>
                    <div className="col-span-2">
                        <Input label="Diğer Kişiler (Grup ise)" {...register("diger_kisiler")} placeholder="Ali Veli, Ayşe Fatma..." />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">İptal</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "Kaydediliyor..." : (initialData ? "Güncelle" : "Giriş Yap")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
