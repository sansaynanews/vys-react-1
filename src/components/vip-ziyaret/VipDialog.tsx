"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

const formSchema = z.object({
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    protokol_turu: z.string().optional(),
    gelis_tarihi: z.string().optional(),
    gelis_saati: z.string().optional(),
    karsilama_yeri: z.string().optional(),
    konaklama_yeri: z.string().optional(),
    notlar: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface VipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function VipDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: VipDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gelis_tarihi: dayjs().format("YYYY-MM-DD")
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    gelis_tarihi: initialData.gelis_tarihi ? dayjs(initialData.gelis_tarihi).format("YYYY-MM-DD") : "",
                });
            } else {
                reset({
                    gelis_tarihi: dayjs().format("YYYY-MM-DD")
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/vip-ziyaret/${initialData.id}` : "/api/vip-ziyaret";
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
            title={initialData ? "VIP Ziyaret Düzenle" : "VIP Ziyaret Ekle"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Input label="Misafir Adı Soyadı" {...register("ad_soyad")} error={errors.ad_soyad?.message} />
                <Input label="Protokol / Unvan" {...register("protokol_turu")} placeholder="Bakan, Müsteşar vb." />

                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Geliş Tarihi" {...register("gelis_tarihi")} />
                    <Input type="time" label="Geliş Saati" {...register("gelis_saati")} />
                </div>

                <div className="border border-slate-100 rounded-lg p-3 bg-slate-50 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Lojistik Detaylar</h4>
                    <Input label="Karşılama Yeri" {...register("karsilama_yeri")} placeholder="Havalimanı VIP vb." />
                    <Input label="Konaklama Yeri" {...register("konaklama_yeri")} placeholder="Otel adı..." />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Notlar</label>
                    <textarea
                        {...register("notlar")}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-20"
                    />
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
