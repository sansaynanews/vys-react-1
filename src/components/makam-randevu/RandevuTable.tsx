"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { Edit2, Trash2, Search, Filter } from "lucide-react";
import RandevuDialog from "./RandevuDialog";

dayjs.locale("tr");

type Randevu = {
    id: number;
    ad_soyad: string;
    kurum: string;
    unvan: string;
    tarih: string;
    saat: string;
    durum: string;
    amac: string;
    iletisim: string;
};

export default function RandevuTable() {
    const [randevular, setRandevular] = useState<Randevu[]>([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState<Randevu | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("durum", statusFilter);

            const res = await fetch(`/api/randevu?${params.toString()}`);
            const json = await res.json();
            setRandevular(json.data || []);
        } catch (error) {
            console.error("Randevular yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, statusFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/randevu/${id}`, { method: "DELETE" });
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
            {/* Filtreler */}
            <div className="p-4 border-b border-slate-100 flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="İsim, kurum veya konu ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                    <option value="">Tüm Durumlar</option>
                    <option value="Bekliyor">Bekliyor</option>
                    <option value="Onaylandı">Onaylandı</option>
                    <option value="İptal">İptal</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                </select>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Tarih / Saat</th>
                            <th className="px-6 py-3">Ad Soyad</th>
                            <th className="px-6 py-3">Kurum / Ünvan</th>
                            <th className="px-6 py-3">Konu</th>
                            <th className="px-6 py-3">Durum</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        Yükleniyor...
                                    </div>
                                </td>
                            </tr>
                        ) : randevular.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    Kayıt bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            randevular.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="font-medium text-slate-800">
                                            {item.tarih ? dayjs(item.tarih).format("D MMMM YYYY") : "-"}
                                        </div>
                                        <div className="text-xs text-slate-500">{item.saat}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-slate-800">{item.ad_soyad}</div>
                                        <div className="text-xs text-slate-500">{item.iletisim}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-slate-800">{item.kurum}</div>
                                        <div className="text-xs text-slate-500">{item.unvan}</div>
                                    </td>
                                    <td className="px-6 py-3 max-w-xs truncate text-slate-600">
                                        {item.amac || "-"}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${item.durum === "Onaylandı"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : item.durum === "Bekliyor"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : item.durum === "İptal"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-slate-100 text-slate-700"
                                                }`}
                                        >
                                            {item.durum}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditItem(item)}
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

            {/* Edit Dialog */}
            {editItem && (
                <RandevuDialog
                    open={!!editItem}
                    onOpenChange={(open) => !open && setEditItem(null)}
                    onSuccess={() => {
                        setEditItem(null);
                        fetchData();
                    }}
                    initialData={editItem}
                />
            )}
        </div>
    );
}
