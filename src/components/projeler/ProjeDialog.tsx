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
    konu: z.string().min(1, "Proje adı gerekli"),
    sahibi: z.string().min(1, "Proje sahibi gerekli"),
    kurum: z.string().optional(),
    iletisim: z.string().optional(),
    baslangic: z.string().optional(),
    bitis: z.string().optional(),
    durum: z.string().optional(),
    hedefler: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function ProjeDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: ProjeDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            baslangic: dayjs().format("YYYY-MM-DD"),
            durum: "Beklemede"
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    baslangic: initialData.baslangic ? dayjs(initialData.baslangic).format("YYYY-MM-DD") : "",
                    bitis: initialData.bitis ? dayjs(initialData.bitis).format("YYYY-MM-DD") : "",
                });
            } else {
                reset({
                    baslangic: dayjs().format("YYYY-MM-DD"),
                    durum: "Beklemede"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/projeler/${initialData.id}` : "/api/projeler";
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
            title={initialData ? "Proje Düzenle" : "Yeni Proje Ekle"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Input label="Proje Adı / Konusu" {...register("konu")} error={errors.konu?.message} />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Proje Sahibi" {...register("sahibi")} error={errors.sahibi?.message} />
                    <Input label="Kurum" {...register("kurum")} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Input type="date" label="Başlangıç" {...register("baslangic")} />
                    <Input type="date" label="Bitiş (Tahmini)" {...register("bitis")} />
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
                </div>

                <Input label="İletişim" {...register("iletisim")} />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Proje Hedefleri / Açıklama</label>
                    <textarea
                        {...register("hedefler")}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-24"
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
