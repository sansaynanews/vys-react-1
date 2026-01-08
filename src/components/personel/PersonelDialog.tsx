"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { User, Phone, Briefcase, FileText } from "lucide-react";

// Schema
const formSchema = z.object({
    ad_soyad: z.string().min(1, "Ad soyad gerekli"),
    birim: z.string().min(1, "Birim gerekli"),
    unvan: z.string().optional(),
    telefon: z.string().optional(),
    eposta: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
    acil_kisi: z.string().optional(),
    acil_tel: z.string().optional(),
    kan_grubu: z.string().optional(),
    baslama_tarihi: z.string().optional(),
    yabanci_dil: z.string().optional(),
    gorev_tanimi: z.string().optional(),
    aciklama: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function PersonelDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
}: PersonelDialogProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"personal" | "contact" | "work">("personal");

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
                const formatDate = (dateString?: string) =>
                    dateString ? new Date(dateString).toISOString().split('T')[0] : '';

                reset({
                    ...initialData,
                    baslama_tarihi: formatDate(initialData.baslama_tarihi),
                });
            } else {
                reset({});
            }
            setActiveTab("personal");
        }
    }, [open, initialData, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setLoading(true);
        try {
            const url = initialData ? `/api/personel/${initialData.id}` : "/api/personel";
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

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title={initialData ? "Personel Düzenle" : "Yeni Personel Ekle"}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-6">
                    <TabButton id="personal" label="Kişisel" icon={User} />
                    <TabButton id="contact" label="İletişim" icon={Phone} />
                    <TabButton id="work" label="Kurumsal" icon={Briefcase} />
                </div>

                {/* Personal Details */}
                <div className={activeTab === "personal" ? "block" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Ad Soyad" {...register("ad_soyad")} error={errors.ad_soyad?.message} placeholder="Ad Soyad" />
                        <Input label="Kan Grubu" {...register("kan_grubu")} placeholder="A Rh+" />
                        <Input label="Yabancı Dil" {...register("yabanci_dil")} placeholder="İngilizce" />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kısa Özgeçmiş / Notlar</label>
                        <textarea
                            {...register("aciklama")}
                            className="w-full min-h-[100px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Personel hakkında notlar..."
                        />
                    </div>
                </div>

                {/* Contact Details */}
                <div className={activeTab === "contact" ? "block" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Telefon" {...register("telefon")} placeholder="0555 555 55 55" />
                        <Input label="E-Posta" {...register("eposta")} error={errors.eposta?.message} placeholder="ornek@email.com" />
                        <Input label="Acil Durum Kişisi" {...register("acil_kisi")} placeholder="Ad Soyad" />
                        <Input label="Acil Durum Tel" {...register("acil_tel")} placeholder="0555 555 55 55" />
                    </div>
                </div>

                {/* Work Details */}
                <div className={activeTab === "work" ? "block" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Birim" {...register("birim")} error={errors.birim?.message} placeholder="Birim Adı" />
                        <Input label="Ünvan" {...register("unvan")} placeholder="Memur, Şef vb." />
                        <Input type="date" label="Başlama Tarihi" {...register("baslama_tarihi")} />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Görev Tanımı</label>
                        <textarea
                            {...register("gorev_tanimi")}
                            className="w-full min-h-[100px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Görev ve sorumluluklar..."
                        />
                    </div>
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
