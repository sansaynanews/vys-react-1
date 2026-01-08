"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

const formSchema = z.object({
    sira_no: z.preprocess((val) => Number(val), z.number().min(1, "Sıra no gerekli")),
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    unvan: z.string().optional(),
    kurum: z.string().optional(),
    telefon: z.string().optional(),
    eposta: z.string().email("Geçerli e-posta giriniz").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface ProtokolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function ProtokolDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: ProtokolDialogProps) {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sira_no: 100
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) reset(initialData);
            else reset({ sira_no: 100 });
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/protokol/${initialData.id}` : "/api/protokol";
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
            title={initialData ? "Protokol Düzenle" : "Protokol Ekle"}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <Input type="number" label="Sıra No" {...register("sira_no")} error={errors.sira_no?.message} />
                    </div>
                    <div className="col-span-3">
                        <Input label="Ad Soyad" {...register("ad_soyad")} error={errors.ad_soyad?.message} />
                    </div>
                </div>

                <Input label="Unvan" {...register("unvan")} />
                <Input label="Kurum" {...register("kurum")} />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Telefon" {...register("telefon")} />
                    <Input label="E-Posta" {...register("eposta")} error={errors.eposta?.message} />
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
