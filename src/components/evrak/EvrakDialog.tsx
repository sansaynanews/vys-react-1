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
    gelis_tarih: z.string().optional(),
    evrak_tarih: z.string().optional(),
    evrak_sayi: z.string().optional(),
    gelen_kurum: z.string().optional(),
    konu: z.string().min(1, "Konu gerekli"),
    notlar: z.string().optional(),
    sunus_tarihi: z.string().optional(),
    teslim_alan: z.string().optional(),
    tur: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EvrakDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function EvrakDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: EvrakDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gelis_tarih: dayjs().format("YYYY-MM-DD"),
            tur: "Gelen Evrak"
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    gelis_tarih: initialData.gelis_tarih ? dayjs(initialData.gelis_tarih).format("YYYY-MM-DD") : "",
                    evrak_tarih: initialData.evrak_tarih ? dayjs(initialData.evrak_tarih).format("YYYY-MM-DD") : "",
                    sunus_tarihi: initialData.sunus_tarihi ? dayjs(initialData.sunus_tarihi).format("YYYY-MM-DD") : "",
                });
            } else {
                reset({
                    gelis_tarih: dayjs().format("YYYY-MM-DD"),
                    tur: "Gelen Evrak"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/evrak/${initialData.id}` : "/api/evrak";
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
            title={initialData ? "Evrak Düzenle" : "Evrak Kayıt"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Geliş Tarihi" {...register("gelis_tarih")} />
                    <Input label="Evrak Sayısı" {...register("evrak_sayi")} placeholder="Sayı / No" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Evrak Tarihi" {...register("evrak_tarih")} />
                    <Select
                        label="Tür"
                        {...register("tur")}
                        options={[
                            { value: "Gelen Evrak", label: "Gelen Evrak" },
                            { value: "Giden Evrak", label: "Giden Evrak" },
                            { value: "Dilekçe", label: "Dilekçe" },
                        ]}
                    />
                </div>

                <Input label="Gönderen Kurum / Kişi" {...register("gelen_kurum")} />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Konu</label>
                    <textarea
                        {...register("konu")}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-20"
                        placeholder="Evrak konusu..."
                    />
                    {errors.konu && <p className="text-xs text-red-500">{errors.konu.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                    <Input type="date" label="Sunuş Tarihi (Varsa)" {...register("sunus_tarihi")} />
                    <Input label="Teslim Alan" {...register("teslim_alan")} />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">İptal</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "Kaydediliyor..." : (initialData ? "Güncelle" : "Kaydet")}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
