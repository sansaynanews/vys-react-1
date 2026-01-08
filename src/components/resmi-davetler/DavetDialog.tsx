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
    sahip: z.string().min(1, "Davet Sahibi gerekli"),
    tur: z.string().optional(),
    tarih: z.string().optional(),
    saat: z.string().optional(),
    yer: z.string().optional(),
    getiren: z.string().optional(),
    gelis_sekli: z.string().optional(),
    gelis_tarih: z.string().optional(),
    katilim_durumu: z.string().optional(),
    aciklama: z.string().optional(),
    iletisim: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DavetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function DavetDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: DavetDialogProps) {
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
            gelis_tarih: dayjs().format("YYYY-MM-DD"),
            katilim_durumu: "Belirsiz"
        }
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    ...initialData,
                    tarih: initialData.tarih ? dayjs(initialData.tarih).format("YYYY-MM-DD") : "",
                    gelis_tarih: initialData.gelis_tarih ? dayjs(initialData.gelis_tarih).format("YYYY-MM-DD") : "",
                });
            } else {
                reset({
                    tarih: dayjs().format("YYYY-MM-DD"),
                    gelis_tarih: dayjs().format("YYYY-MM-DD"),
                    katilim_durumu: "Belirsiz"
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/resmi-davetler/${initialData.id}` : "/api/resmi-davetler";
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
            title={initialData ? "Davet Düzenle" : "Resmi Davet Ekle"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Davet Eden (Kurum/Kişi)" {...register("sahip")} error={errors.sahip?.message} />
                    <Input label="Davet Türü" {...register("tur")} placeholder="Düğün, Açılış vb." />
                </div>

                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <h3 className="text-xs font-bold text-red-800 mb-2 uppercase tracking-wide">Etkinlik Bilgileri</h3>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <Input type="date" label="Tarih" {...register("tarih")} />
                        <Input type="time" label="Saat" {...register("saat")} />
                    </div>
                    <Input label="Yer / Mekan" {...register("yer")} />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Geliş Detayları</h3>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <Input type="date" label="Geliş Tarihi" {...register("gelis_tarih")} />
                        <Select
                            label="Geliş Şekli"
                            {...register("gelis_sekli")}
                            options={[{ value: "Kurye", label: "Kurye/Posta" }, { value: "Elden", label: "Elden" }, { value: "Fax/Email", label: "Fax/Email" }]}
                        />
                    </div>
                    <Input label="Getiren Kişi" {...register("getiren")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Katılım Durumu"
                        {...register("katilim_durumu")}
                        options={[
                            { value: "Belirsiz", label: "Belirsiz" },
                            { value: "Katılacak", label: "Katılacak" },
                            { value: "Katılmayacak", label: "Katılmayacak" },
                            { value: "Temsilci", label: "Temsilci Gönderilecek" },
                        ]}
                    />
                    <Input label="İletişim (LCV)" {...register("iletisim")} />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Açıklama / Notlar</label>
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
