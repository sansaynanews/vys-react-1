"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const formSchema = z.object({
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    ilce: z.string().optional(),
    mahalle_koy: z.string().min(1, "Mahalle/Köy gerekli"),
    gsm: z.string().min(1, "GSM gerekli"),
    sabit_tel: z.string().optional(),
    email: z.string().email("Geçerli bir email giriniz").optional().or(z.literal("")),
    foto: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Örnek İlçe Listesi (Proje geneli için statik veya dinamik olabilir)
const ILCELER = [
    "Merkez", "Akdağmadeni", "Aydıncık", "Boğazlıyan",
    "Çandır", "Çayıralan", "Çekerek", "Kadışehri",
    "Saraykent", "Sarıkaya", "Sorgun", "Şefaatli",
    "Yenifakılı", "Yerköy"
];

interface MuhtarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function MuhtarDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: MuhtarDialogProps) {
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
            reset(initialData || { ilce: "Merkez" });
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/muhtar/${initialData.id}` : "/api/muhtar";
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
            title={initialData ? "Muhtar Düzenle" : "Yeni Muhtar Ekle"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="İlçe"
                        {...register("ilce")}
                        options={ILCELER.map(i => ({ value: i, label: i }))}
                    />
                    <Input label="Mahalle / Köy" {...register("mahalle_koy")} error={errors.mahalle_koy?.message} />
                </div>

                <Input label="Ad Soyad" {...register("ad_soyad")} error={errors.ad_soyad?.message} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="GSM" {...register("gsm")} error={errors.gsm?.message} placeholder="0555..." />
                    <Input label="Sabit Telefon" {...register("sabit_tel")} />
                </div>

                <Input label="E-Posta" {...register("email")} error={errors.email?.message} />
                <Input label="Fotoğraf URL (Opsiyonel)" {...register("foto")} placeholder="http://..." />

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
