"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

const formSchema = z.object({
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    unvan: z.string().optional(),
    kurum: z.string().optional(),
    telefon: z.string().min(1, "Telefon gerekli"),
    telefon2: z.string().optional(),
    dahili: z.string().optional(),
    email: z.string().email("Geçersiz e-posta").optional().or(z.literal("")),
    adres: z.string().optional(),
    aciklama: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RehberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function RehberDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: RehberDialogProps) {
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
            if (initialData) reset(initialData);
            else reset({});
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/rehber/${initialData.id}` : "/api/rehber";
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
            title={initialData ? "Kişi Düzenle" : "Kişi Ekle"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Input label="Ad Soyad" {...register("ad_soyad")} error={errors.ad_soyad?.message} />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Unvan" {...register("unvan")} />
                    <Input label="Kurum" {...register("kurum")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Telefon (GSM)" {...register("telefon")} error={errors.telefon?.message} />
                    <Input label="Telefon 2 (Sabit)" {...register("telefon2")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Dahili No" {...register("dahili")} />
                    <Input label="E-Posta" {...register("email")} error={errors.email?.message} />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Notlar</label>
                    <textarea
                        {...register("aciklama")}
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
