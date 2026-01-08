"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const formSchema = z.object({
    plaka: z.string().min(1, "Plaka gerekli"),
    marka: z.string().min(1, "Marka gerekli"),
    model: z.string().optional(),
    model_yili: z.preprocess((val) => Number(val), z.number().optional()),
    ruhsat_seri: z.string().optional(),
    lastik_ebat: z.string().optional(),
    renk: z.string().optional(),
    tur: z.string().optional(),
    yakit: z.string().optional(),
    kurum: z.string().optional(),
    bakim_son: z.string().optional(),
    bakim_sonraki: z.string().optional(),
    sigorta_bas: z.string().optional(),
    sigorta_bit: z.string().optional(),
    kasko_bas: z.string().optional(),
    kasko_bit: z.string().optional(),
    muayene_tarih: z.string().optional(),
    muayene_bit: z.string().optional(),
    bakim_son_km: z.preprocess((val) => Number(val), z.number().optional()),
    bakim_sonraki_km: z.preprocess((val) => Number(val), z.number().optional()),
    lastik_degisim_tarih: z.string().optional(),
    diger_aciklama: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AracDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function AracDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: AracDialogProps) {
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
            if (initialData) {
                // Format dates for input type="date"
                const formatDate = (dateString?: string) =>
                    dateString ? new Date(dateString).toISOString().split('T')[0] : '';

                reset({
                    ...initialData,
                    bakim_son: formatDate(initialData.bakim_son),
                    sigorta_bas: formatDate(initialData.sigorta_bas),
                    sigorta_bit: formatDate(initialData.sigorta_bit),
                    kasko_bas: formatDate(initialData.kasko_bas),
                    kasko_bit: formatDate(initialData.kasko_bit),
                    muayene_tarih: formatDate(initialData.muayene_tarih),
                    muayene_bit: formatDate(initialData.muayene_bit),
                    lastik_degisim_tarih: formatDate(initialData.lastik_degisim_tarih),
                });
            } else {
                reset({});
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/arac/${initialData.id}` : "/api/arac";
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
            title={initialData ? "Araç Düzenle" : "Yeni Araç Ekle"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Genel Bilgiler */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-1 border-b">Genel Bilgiler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Plaka" {...register("plaka")} error={errors.plaka?.message} placeholder="34 ABC 123" />
                        <Input label="Ruhsat Seri No" {...register("ruhsat_seri")} placeholder="AB 123456" />
                        <Input label="Marka" {...register("marka")} error={errors.marka?.message} placeholder="Volkswagen" />
                        <Input label="Model" {...register("model")} placeholder="Passat" />
                        <Input label="Model Yılı" type="number" {...register("model_yili")} placeholder="2023" />
                        <Input label="Renk" {...register("renk")} placeholder="Siyah" />
                        <Select
                            label="Yakıt Tipi"
                            {...register("yakit")}
                            options={[
                                { value: "Benzin", label: "Benzin" },
                                { value: "Dizel", label: "Dizel" },
                                { value: "Hibrit", label: "Hibrit" },
                                { value: "Elektrik", label: "Elektrik" },
                            ]}
                        />
                        <Input label="Kurum/Birim" {...register("kurum")} placeholder="Özel Kalem" />
                    </div>
                </div>

                {/* Sigorta & Muayene */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-1 border-b">Sigorta & Muayene</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="date" label="Sigorta Başlangıç" {...register("sigorta_bas")} />
                        <Input type="date" label="Sigorta Bitiş" {...register("sigorta_bit")} />
                        <Input type="date" label="Kasko Başlangıç" {...register("kasko_bas")} />
                        <Input type="date" label="Kasko Bitiş" {...register("kasko_bit")} />
                        <Input type="date" label="Muayene Tarihi" {...register("muayene_tarih")} />
                        <Input type="date" label="Muayene Bitiş" {...register("muayene_bit")} />
                    </div>
                </div>

                {/* Bakım Bilgileri */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 pb-1 border-b">Bakım Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="date" label="Son Bakım Tarihi" {...register("bakim_son")} />
                        <div className="flex gap-2">
                            <Input label="Son Bakım KM" type="number" {...register("bakim_son_km")} placeholder="KM" />
                        </div>
                        <Input label="Gelecek Bakım (KM/Tarih)" {...register("bakim_sonraki")} placeholder="15000 KM sonra" />
                        <Input label="Lastik Ebat" {...register("lastik_ebat")} placeholder="205/55 R16" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Diğer Açıklamalar</label>
                    <textarea
                        {...register("diger_aciklama")}
                        className="w-full min-h-[60px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Notlar..."
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
