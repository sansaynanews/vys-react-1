"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const formSchema = z.object({
    salon_id: z.preprocess((val) => Number(val), z.number().min(1, "Salon seçimi gerekli")),
    baslik: z.string().min(1, "Başlık gerekli"),
    tur: z.string().optional(),
    rez_sahibi: z.string().optional(),
    departman: z.string().optional(),
    iletisim: z.string().optional(),
    tarih: z.string().min(1, "Tarih gerekli"),
    bas_saat: z.string().min(1, "Başlangıç saati gerekli"),
    bit_saat: z.string().min(1, "Bitiş saati gerekli"),
    kararlar: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RezervasyonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function RezervasyonDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: RezervasyonDialogProps) {
    const [loading, setLoading] = useState(false);
    const [salonlar, setSalonlar] = useState<any[]>([]);

    // Salonları getir
    useEffect(() => {
        fetch("/api/toplanti-salonu")
            .then(res => res.json())
            .then(data => setSalonlar(data.data || []))
            .catch(err => console.error("Salonlar yüklenemedi", err));
    }, []);

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
                // Date handling
                reset({
                    ...initialData,
                    tarih: initialData.tarih ? new Date(initialData.tarih).toISOString().split("T")[0] : ""
                });
            } else {
                reset({});
            }
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/salon-rezervasyon/${initialData.id}` : "/api/salon-rezervasyon";
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
            title={initialData ? "Rezervasyon Düzenle" : "Yeni Rezervasyon"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Salon ve Tarih */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Salon"
                        {...register("salon_id")}
                        error={errors.salon_id?.message}
                        options={salonlar.map(s => ({ label: s.ad + (s.kapasite ? ` (${s.kapasite} kişilik)` : ""), value: s.id }))}
                    />
                    <Input type="date" label="Tarih" {...register("tarih")} error={errors.tarih?.message} />
                </div>

                {/* Saatler */}
                <div className="grid grid-cols-2 gap-4">
                    <Input type="time" label="Başlangıç" {...register("bas_saat")} error={errors.bas_saat?.message} />
                    <Input type="time" label="Bitiş" {...register("bit_saat")} error={errors.bit_saat?.message} />
                </div>

                {/* Detaylar */}
                <Input label="Toplantı Başlığı" {...register("baslik")} error={errors.baslik?.message} placeholder="Örn: Haftalık Koordinasyon" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Rezerve Eden / Sorumlu" {...register("rez_sahibi")} placeholder="Ad Soyad" />
                    <Input label="Departman" {...register("departman")} placeholder="Birim Adı" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="İletişim" {...register("iletisim")} placeholder="Dahili / Cep" />
                    <Select
                        label="Tür"
                        {...register("tur")}
                        options={[
                            { value: "Toplantı", label: "Toplantı" },
                            { value: "Eğitim", label: "Eğitim" },
                            { value: "Sunum", label: "Sunum" },
                            { value: "Ziyaret", label: "Ziyaret" },
                            { value: "Diğer", label: "Diğer" },
                        ]}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notlar / Kararlar</label>
                    <textarea
                        {...register("kararlar")}
                        className="w-full min-h-[60px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="..."
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
                        {initialData ? "Güncelle" : "Oluştur"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
