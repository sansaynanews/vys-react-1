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
    tarih: z.string().optional(),
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    kurum: z.string().optional(),
    iletisim: z.string().optional(),
    konu: z.string().optional(),
    durum: z.string().optional(),
    notlar: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TalepDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function TalepDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: TalepDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tarih: dayjs().format("YYYY-MM-DD"),
            durum: "Bekliyor"
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    tarih: initialData.tarih ? dayjs(initialData.tarih).format("YYYY-MM-DD") : "",
                });
            } else {
                reset({
                    tarih: dayjs().format("YYYY-MM-DD"),
                    durum: "Bekliyor"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/gorusme-talepleri/${initialData.id}` : "/api/gorusme-talepleri";
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
            title={initialData ? "Talep Düzenle" : "Görüşme Talebi Ekle"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="flex justify-between gap-4">
                    <div className="w-1/3">
                        <Input type="date" label="Talep Tarihi" {...register("tarih")} />
                    </div>
                    <div className="w-2/3">
                        <Select
                            label="Durum"
                            {...register("durum")}
                            options={[
                                { value: "Bekliyor", label: "Bekliyor" },
                                { value: "Onaylandı", label: "Onaylandı" },
                                { value: "Reddedildi", label: "Reddedildi" },
                                { value: "Ertelendi", label: "Ertelendi" },
                            ]}
                        />
                    </div>
                </div>

                <Input label="Adı Soyadı" {...register("ad_soyad")} error={errors.ad_soyad?.message} />
                <Input label="Kurum" {...register("kurum")} />
                <Input label="İletişim" {...register("iletisim")} />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Konu</label>
                    <textarea
                        {...register("konu")}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-16"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Notlar</label>
                    <textarea
                        {...register("notlar")}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-16"
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
