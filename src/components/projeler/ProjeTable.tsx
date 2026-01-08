"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Calendar, Target, CheckCircle2, Clock, Filter } from "lucide-react";
import ProjeDialog from "./ProjeDialog";

export default function ProjeTable() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tümü");
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter !== "Tümü") params.append("status", statusFilter);

            const res = await fetch(`/api/projeler?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search, statusFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/projeler/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Tamamlandı": return "bg-green-100 text-green-700 border-green-200";
            case "Devam Ediyor": return "bg-blue-100 text-blue-700 border-blue-200";
            case "İptal": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-amber-100 text-amber-700 border-amber-200"; // Beklemede
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Projeler</h1>
                    <p className="text-slate-500">Devam Eden ve Tamamlanan Projeler</p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 py-2 cursor-pointer"
                        >
                            <option value="Tümü">Tüm Durumlar</option>
                            <option value="Beklemede">Beklemede</option>
                            <option value="Devam Ediyor">Devam Ediyor</option>
                            <option value="Tamamlandı">Tamamlandı</option>
                            <option value="İptal">İptal</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder="Proje Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Proje Ekle
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Proje Adı</th>
                            <th className="px-6 py-3">Sahibi/Kurum</th>
                            <th className="px-6 py-3">Tarih Aralığı</th>
                            <th className="px-6 py-3">Durum</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr> :
                            items.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">Proje bulunamadı.</td></tr> :
                                items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{item.konu}</div>
                                            {item.hedefler && <div className="text-xs text-slate-500 truncate max-w-xs">{item.hedefler}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-700">{item.sahibi}</div>
                                            <div className="text-xs text-slate-500">{item.kurum}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-slate-600 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                <span>{item.baslangic || "?"} - {item.bitis || "?"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusStyle(item.durum)}`}>
                                                {item.durum}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            <ProjeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
