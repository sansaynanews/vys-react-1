"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { Edit2, Trash2, Search, User, Phone, Mail, Building } from "lucide-react";
import PersonelDialog from "./PersonelDialog";

dayjs.locale("tr");

export default function PersonelTable() {
    const [personel, setPersonel] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [search, setSearch] = useState("");
    const [birimFilter, setBirimFilter] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (birimFilter) params.append("birim", birimFilter);

            const res = await fetch(`/api/personel?${params.toString()}`);
            const json = await res.json();
            setPersonel(json.data || []);
        } catch (error) {
            console.error("Personel listesi yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, birimFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu personeli silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/personel/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Silme işlemi başarısız oldu");
            }
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    };

    return (
        <div>
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Personel Yönetimi</h1>
                    <p className="text-slate-500">Personel listesi ve özlük işlemleri</p>
                </div>
                <button
                    onClick={() => {
                        setEditItem(null);
                        setIsDialogOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <User className="w-4 h-4" />
                    Yeni Personel
                </button>
            </div>

            {/* Filtreler */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg mb-4 flex gap-4 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="İsim veya ünvan ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <input
                    type="text"
                    placeholder="Birim filtresi..."
                    value={birimFilter}
                    onChange={(e) => setBirimFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            {/* Tablo */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Ad Soyad / Ünvan</th>
                                <th className="px-6 py-3">Birim</th>
                                <th className="px-6 py-3">İletişim</th>
                                <th className="px-6 py-3">Başlama Tarihi</th>
                                <th className="px-6 py-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : personel.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                personel.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                    {item.ad_soyad.substring(0, 1)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{item.ad_soyad}</div>
                                                    <div className="text-xs text-slate-500">{item.unvan || "-"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-700">{item.birim}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {item.telefon && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        {item.telefon}
                                                    </div>
                                                )}
                                                {item.eposta && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                        {item.eposta}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {item.baslama_tarihi ? dayjs(item.baslama_tarihi).format("D MMMM YYYY") : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditItem(item);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Dialog */}
            <PersonelDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => {
                    fetchData();
                    setEditItem(null);
                }}
                initialData={editItem}
            />
        </div>
    );
}
