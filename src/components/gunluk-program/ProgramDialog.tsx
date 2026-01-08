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
    tarih: z.string().min(1, "Tarih gerekli"),
    saat: z.string().min(1, "Saat gerekli"),
    tur: z.string().optional(),
    aciklama: z.string().min(1, "Açıklama gerekli"),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgramDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function ProgramDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: ProgramDialogProps) {
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
            saat: "09:00"
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
                    saat: "09:00"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/gunluk-program/${initialData.id}` : "/api/gunluk-program";
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
            title={initialData ? "Programı Düzenle" : "Program Ekle"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Tarih" {...register("tarih")} error={errors.tarih?.message} />
                    <Input type="time" label="Saat" {...register("saat")} error={errors.saat?.message} />
                </div>

                <Select
                    label="Etkinlik Türü"
                    {...register("tur")}
                    options={[
                        { value: "Toplantı", label: "Toplantı" },
                        { value: "Ziyaret", label: "Ziyaret (Kabul)" },
                        { value: "Tören", label: "Tören / Etkinlik" },
                        { value: "İnceleme", label: "İnceleme / Denetim" },
                        { value: "Diğer", label: "Diğer" },
                    ]}
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Açıklama / Detay</label>
                    <textarea
                        {...register("aciklama")}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-24"
                        placeholder="Program detayı..."
                    />
                    {errors.aciklama && <p className="text-xs text-red-500">{errors.aciklama.message}</p>}
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
