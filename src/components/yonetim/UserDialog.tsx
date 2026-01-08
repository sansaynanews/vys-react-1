"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const formSchema = z.object({
    kadi: z.string().min(1, "Kullanıcı adı gerekli"),
    ad_soyad: z.string().optional(),
    yetki: z.string().min(1, "Yetki seçimi gerekli"),
    sifre: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function UserDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: UserDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            yetki: "kullanici"
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    kadi: initialData.kadi,
                    ad_soyad: initialData.ad_soyad,
                    yetki: initialData.yetki,
                    sifre: "", // Don't show existing password
                });
            } else {
                reset({
                    kadi: "",
                    ad_soyad: "",
                    yetki: "kullanici",
                    sifre: ""
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/yonetim/${initialData.id}` : "/api/yonetim";
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
            title={initialData ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Input label="Kullanıcı Adı" {...register("kadi")} error={errors.kadi?.message} />
                <Input label="Ad Soyad" {...register("ad_soyad")} />

                <Select
                    label="Yetki"
                    {...register("yetki")}
                    options={[
                        { value: "admin", label: "Yönetici (Admin)" },
                        { value: "ozel_kalem", label: "Özel Kalem" },
                        { value: "kullanici", label: "Kullanıcı" },
                    ]} // Adjust roles based on actual system needs
                    error={errors.yetki?.message}
                />

                <div className="pt-2">
                    <Input
                        type="password"
                        label={initialData ? "Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)" : "Şifre"}
                        {...register("sifre")}
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
