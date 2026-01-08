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
    tur: z.string().optional(),
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    kurum: z.string().optional(),
    medeni: z.string().optional(),
    es_ad: z.string().optional(),
    anne_ad: z.string().optional(),
    baba_ad: z.string().optional(),
    cocuk_sayisi: z.string().optional().or(z.number()),
    cocuk_adlari: z.string().optional(),
    olay_yeri: z.string().optional(),
    olay_tarih: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BilgiDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function BilgiDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: BilgiDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tur: "Gazi",
            medeni: "Evli"
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    olay_tarih: initialData.olay_tarih ? dayjs(initialData.olay_tarih).format("YYYY-MM-DD") : "",
                });
            } else {
                reset({
                    tur: "Gazi",
                    medeni: "Evli"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/sehit-gazi-bilgi/${initialData.id}` : "/api/sehit-gazi-bilgi";
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
            title={initialData ? "Kayıt Düzenle" : "Yeni Şehit/Gazi Kaydı"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="flex gap-4">
                    <div className="w-1/3">
                        <Select
                            label="Tür"
                            {...register("tur")}
                            options={[{ value: "Şehit", label: "Şehit" }, { value: "Gazi", label: "Gazi" }]}
                        />
                    </div>
                    <div className="w-2/3">
                        <Input label="Adı Soyadı" {...register("ad_soyad")} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Baba Adı" {...register("baba_ad")} />
                    <Input label="Anne Adı" {...register("anne_ad")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Olay Yeri" {...register("olay_yeri")} />
                    <Input type="date" label="Olay Tarihi" {...register("olay_tarih")} />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Aile Bilgileri</h3>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <Select
                            label="Medeni Hali"
                            {...register("medeni")}
                            options={[{ value: "Evli", label: "Evli" }, { value: "Bekar", label: "Bekar" }]}
                        />
                        <Input label="Eş Adı" {...register("es_ad")} />
                    </div>

                    <div className="mb-2">
                        <Input type="number" label="Çocuk Sayısı" {...register("cocuk_sayisi")} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Çocuk Adları</label>
                        <textarea
                            {...register("cocuk_adlari")}
                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-16"
                            placeholder="Ahmet, Mehmet, Ayşe..."
                        />
                    </div>
                </div>

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
