"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const formSchema = z.object({
    konu: z.string().min(1, "Konu gerekli"),
    verilen_kisi: z.string().min(1, "Verilen kişi gerekli"),
    kurum: z.string().optional(),
    iletisim: z.string().optional(),
    tarih: z.string().optional(),
    durum: z.string().optional(),
    icerik: z.string().optional(),
    onem_derecesi: z.string().optional(),
    tamamlanma_tarihi: z.string().optional(),
    tamamlayan_kisi: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TalimatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function TalimatDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: TalimatDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tarih: dayjs().format("YYYY-MM-DD"),
            durum: "Beklemede",
            onem_derecesi: "Normal"
        }
    });

    const durum = watch("durum");

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    tarih: initialData.tarih ? dayjs(initialData.tarih).format("YYYY-MM-DD") : "",
                    tamamlanma_tarihi: initialData.tamamlanma_tarihi ? dayjs(initialData.tamamlanma_tarihi).format("YYYY-MM-DD") : "",
                });
            } else {
                reset({
                    tarih: dayjs().format("YYYY-MM-DD"),
                    durum: "Beklemede",
                    onem_derecesi: "Normal"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/talimatlar/${initialData.id}` : "/api/talimatlar";
            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Hata");
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
            title={initialData ? "Talimat Düzenle" : "Yeni Talimat Ekle"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Input label="Konu / Başlık" {...register("konu")} error={errors.konu?.message} />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Verilen Kişi / Birim" {...register("verilen_kisi")} error={errors.verilen_kisi?.message} />
                    <Input label="Kurum" {...register("kurum")} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Input type="date" label="Veriliş Tarihi" {...register("tarih")} />
                    <Select
                        label="Durum"
                        {...register("durum")}
                        options={[
                            { value: "Beklemede", label: "Beklemede" },
                            { value: "Devam Ediyor", label: "Devam Ediyor" },
                            { value: "Tamamlandı", label: "Tamamlandı" },
                            { value: "İptal", label: "İptal" },
                        ]}
                    />
                    <Select
                        label="Önem Derecesi"
                        {...register("onem_derecesi")}
                        options={[
                            { value: "Normal", label: "Normal" },
                            { value: "Acil", label: "Acil" },
                            { value: "Çok Acil", label: "Çok Acil" },
                        ]}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Talimat İçeriği / Detaylar</label>
                    <textarea
                        {...register("icerik")}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-24"
                    />
                </div>

                {durum === "Tamamlandı" && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                        <h3 className="text-xs font-bold text-green-800 mb-2 uppercase tracking-wide">Tamamlanma Bilgileri</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="date" label="Tamamlanma Tarihi" {...register("tamamlanma_tarihi")} />
                            <Input label="Tamamlayan Kişi" {...register("tamamlayan_kisi")} />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">İptal</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
