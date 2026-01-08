"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const formSchema = z.object({
    adi: z.string().min(1, "Stok adı gerekli"),
    cesit: z.string().min(1, "Çeşit/Model gerekli"),
    kategori: z.string().optional(),
    tur: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StokDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function StokDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: StokDialogProps) {
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
            reset(initialData || { kategori: "Genel", tur: "genel" });
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/stok/${initialData.id}` : "/api/stok";
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
            title={initialData ? "Stok Kartı Düzenle" : "Yeni Stok Kartı"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Stok Adı" {...register("adi")} error={errors.adi?.message} placeholder="Örn: A4 Kağıt" />
                <Input label="Çeşit / Marka / Model" {...register("cesit")} error={errors.cesit?.message} placeholder="Örn: 80gr 1 Koli" />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Kategori"
                        {...register("kategori")}
                        options={[
                            { value: "Genel", label: "Genel" },
                            { value: "Kırtasiye", label: "Kırtasiye" },
                            { value: "Elektronik", label: "Elektronik" },
                            { value: "Temizlik", label: "Temizlik" },
                            { value: "Gıda", label: "Gıda" },
                        ]}
                    />
                    <Select
                        label="Tür"
                        {...register("tur")}
                        options={[
                            { value: "genel", label: "Genel" },
                            { value: "demirbas", label: "Demirbaş" },
                            { value: "sarf", label: "Sarf Malzeme" },
                        ]}
                    />
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
