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
    stok_id: z.preprocess((val) => Number(val), z.number().min(1, "Stok seçimi gerekli")),
    tur: z.enum(["Giriş", "Çıkış"]),
    miktar: z.preprocess((val) => Number(val), z.number().min(1, "En az 1 adet")),
    kisi: z.string().optional(),
    tarih: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface HareketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    preSelectedId?: number | null;
}

export default function HareketDialog({
    open,
    onOpenChange,
    onSuccess,
    preSelectedId,
}: HareketDialogProps) {
    const [loading, setLoading] = useState(false);
    const [stoklar, setStoklar] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/stok").then(r => r.json()).then(d => setStoklar(d.data || []));
    }, []);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tur: "Giriş",
            tarih: dayjs().format("YYYY-MM-DD"),
            miktar: 1
        }
    });

    useEffect(() => {
        if (open && preSelectedId) {
            reset({
                stok_id: preSelectedId,
                tur: "Giriş",
                tarih: dayjs().format("YYYY-MM-DD"),
                miktar: 1
            });
        }
    }, [open, preSelectedId, reset]);

    const turValue = watch("tur");

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const response = await fetch("/api/stok/hareket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    // Tarihi DD.MM.YYYY formatına çevirebiliriz backend uyumluluğu için, ama backend zaten string alıyor.
                    // API tarafında dayjs(Date).format yapılıyor veya direkt string kullanılıyor. Arayüzde YYYY-MM-DD.
                    // Backend'de stok_hareketleri.tarih string olduğu için, front'tan geleni formatlayalım:
                    tarih: dayjs(data.tarih).format("DD.MM.YYYY")
                }),
            });

            const resText = await response.json();

            if (!response.ok) {
                throw new Error(resText.error || "İşlem başarısız");
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
            title="Stok Hareketi Ekle"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <Select
                    label="Stok Kartı"
                    {...register("stok_id")}
                    error={errors.stok_id?.message}
                    options={stoklar.map(s => ({ value: s.id, label: `${s.adi} (${s.cesit}) - Stok: ${s.miktar}` }))}
                    disabled={!!preSelectedId} // Eğer bir karttan açıldıysa değiştirilemesin
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="İşlem Türü"
                        {...register("tur")}
                        options={[
                            { value: "Giriş", label: "Stok Girişi (+)" },
                            { value: "Çıkış", label: "Stok Çıkışı (-)" },
                        ]}
                    />
                    <Input type="number" label="Miktar" {...register("miktar")} error={errors.miktar?.message} />
                </div>

                <Input
                    label={turValue === "Giriş" ? "Tedarikçi / Alınan Kişi" : "Teslim Alan Kişi"}
                    {...register("kisi")}
                    placeholder="İsim veya Firma"
                />

                <Input type="date" label="Tarih" {...register("tarih")} />

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">İptal</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "İşleniyor..." : "Onayla"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
