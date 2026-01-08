"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

const formSchema = z.object({
    ad: z.string().min(1, "Salon adı gerekli"),
    kapasite: z.preprocess((val) => Number(val), z.number().optional()),
    konum: z.string().optional(),
    ekipman: z.string().optional(),
    notlar: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SalonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function SalonDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: SalonDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (open) {
            reset(initialData || {});
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/toplanti-salonu/${initialData.id}` : "/api/toplanti-salonu";
            const method = initialData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "İşlem başarısız");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title={initialData ? "Salon Düzenle" : "Yeni Salon Ekle"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Salon Adı" {...register("ad")} error={errors.ad?.message} placeholder="Örn: Toplantı Salonu 1" />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Kapasite" type="number" {...register("kapasite")} placeholder="20" />
                    <Input label="Konum" {...register("konum")} placeholder="1. Kat" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ekipmanlar</label>
                    <textarea
                        {...register("ekipman")}
                        className="w-full min-h-[60px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Projeksiyon, Mikrofon, TV..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
                    <textarea
                        {...register("notlar")}
                        className="w-full min-h-[60px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Diğer açıklamalar..."
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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
