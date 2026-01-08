"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

const formSchema = z.object({
    baslik: z.string().min(1, "Başlık gerekli"),
    kategori: z.string().min(1, "Kategori gerekli"),
    tarih: z.string().optional(),
    saat: z.string().optional(),
    icerik: z.string().min(1, "Konuşma metni gerekli"),
});

type FormValues = z.infer<typeof formSchema>;

interface KonusmaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function KonusmaDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: KonusmaDialogProps) {
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
            kategori: "Genel"
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
                    kategori: "Genel",
                    saat: "10:00"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/konusma-metinleri/${initialData.id}` : "/api/konusma-metinleri";
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
            title={initialData ? "Metin Düzenle" : "Yeni Konuşma Metni"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Input label="Konuşma Başlığı" {...register("baslik")} error={errors.baslik?.message} />

                <div className="grid grid-cols-3 gap-4">
                    <Input label="Kategori" {...register("kategori")} error={errors.kategori?.message} placeholder="Bayram, Açılış vb." />
                    <Input type="date" label="Tarih" {...register("tarih")} />
                    <Input type="time" label="Saat" {...register("saat")} />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Metin İçeriği</label>
                    <textarea
                        {...register("icerik")}
                        className="w-full rounded-lg border border-slate-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y h-96 font-serif leading-relaxed"
                        placeholder="Konuşma metnini buraya giriniz..."
                    />
                    {errors.icerik && <p className="text-xs text-red-500">{errors.icerik.message}</p>}
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
