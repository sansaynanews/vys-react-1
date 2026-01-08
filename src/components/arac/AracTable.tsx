"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { Edit2, Trash2, Search, Car, Calendar, AlertTriangle } from "lucide-react";
import AracDialog from "./AracDialog";

dayjs.locale("tr");

export default function AracTable() {
    const [araclar, setAraclar] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [search, setSearch] = useState("");
    const [kurumFilter, setKurumFilter] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (kurumFilter) params.append("kurum", kurumFilter);

            const res = await fetch(`/api/arac?${params.toString()}`);
            const json = await res.json();
            setAraclar(json.data || []);
        } catch (error) {
            console.error("Araçlar yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, kurumFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu aracı silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/arac/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Silme işlemi başarısız oldu");
            }
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    };

    const isExpired = (dateString?: string) => {
        if (!dateString) return false;
        return dayjs(dateString).isBefore(dayjs());
    };

    const isNear = (dateString?: string) => {
        if (!dateString) return false;
        const diff = dayjs(dateString).diff(dayjs(), 'day');
        return diff >= 0 && diff <= 30; // 30 days warning
    };

    return (
        <div>
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Araç Yönetimi</h1>
                    <p className="text-slate-500">Araç filosu, bakım ve sigorta takibi</p>
                </div>
                <button
                    onClick={() => {
                        setEditItem(null);
                        setIsDialogOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Car className="w-4 h-4" />
                    Yeni Araç
                </button>
            </div>

            {/* Filtreler */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg mb-4 flex gap-4 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Plaka veya marka ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <input
                    type="text"
                    placeholder="Kurum filtresi..."
                    value={kurumFilter}
                    onChange={(e) => setKurumFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            {/* Tablo */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Araç Bilgisi</th>
                                <th className="px-6 py-3">Kurum / Birim</th>
                                <th className="px-6 py-3">Sigorta Durumu</th>
                                <th className="px-6 py-3">Muayene / Bakım</th>
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
                            ) : araclar.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                araclar.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-white group-hover:ring-blue-50 transition">
                                                    {item.plaka.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{item.plaka}</div>
                                                    <div className="text-xs text-slate-500">{item.marka} {item.model}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-800 font-medium">{item.kurum || "-"}</div>
                                            <div className="text-xs text-slate-500">{item.yakit || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-400 w-16">Sigorta:</span>
                                                    <span className={isExpired(item.sigorta_bit) ? "text-red-600 font-bold" : isNear(item.sigorta_bit) ? "text-amber-600 font-bold" : "text-emerald-700"}>
                                                        {item.sigorta_bit ? dayjs(item.sigorta_bit).format("DD.MM.YYYY") : "-"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-400 w-16">Kasko:</span>
                                                    <span className={isExpired(item.kasko_bit) ? "text-red-600 font-bold" : isNear(item.kasko_bit) ? "text-amber-600 font-bold" : "text-emerald-700"}>
                                                        {item.kasko_bit ? dayjs(item.kasko_bit).format("DD.MM.YYYY") : "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    <span className={isExpired(item.muayene_bit) ? "text-red-600 font-bold" : "text-slate-600"}>
                                                        {item.muayene_bit ? dayjs(item.muayene_bit).format("DD.MM.YYYY") : "Muayene Yok"}
                                                    </span>
                                                </div>
                                                {item.bakim_son_km && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>Son: {item.bakim_son_km} KM</span>
                                                    </div>
                                                )}
                                            </div>
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
            <AracDialog
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
