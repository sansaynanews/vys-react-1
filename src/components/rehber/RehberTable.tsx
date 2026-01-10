"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Phone, Mail, Building, Menu, Grid, List as ListIcon } from "lucide-react";
import RehberDialog from "./RehberDialog";

export default function RehberTable() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            const res = await fetch(`/api/rehber?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/rehber/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div className="space-y-6">
            {/* Toolbar Area */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        placeholder="Ad Soyad, Kurum, Telefon Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* View Toggles */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            title="Liste Görünümü"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            title="Kart Görünümü"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Yeni Kişi Ekle
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Rehber yükleniyor...</div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Phone className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium">Kayıt bulunamadı</p>
                    <p className="text-sm opacity-60">Aradığınız kriterlere uygun kişi rehberde yok.</p>
                </div>
            ) : viewMode === "list" ? (
                /* LIST VIEW (TABLE) */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Ad Soyad / Ünvan</th>
                                    <th className="px-6 py-4 font-semibold">Kurum</th>
                                    <th className="px-6 py-4 font-semibold">Telefon / Dahili</th>
                                    <th className="px-6 py-4 font-semibold">E-Posta</th>
                                    <th className="px-4 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                                                    {item.ad_soyad?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800">{item.ad_soyad}</div>
                                                    {item.unvan && <div className="text-[11px] text-slate-500 uppercase font-medium mt-0.5">{item.unvan}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-600 font-medium">{item.kurum || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {item.telefon && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-mono text-slate-700">{item.telefon}</span>
                                                    </div>
                                                )}
                                                {item.dahili && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold border border-slate-200 min-w-[30px] text-center">DAH</span>
                                                        <span className="font-mono text-xs text-slate-600 font-bold">{item.dahili}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.email ? (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <a href={`mailto:${item.email}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{item.email}</a>
                                                </div>
                                            ) : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 transform translate-x-2 sm:group-hover:translate-x-0">
                                                <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-2 bg-white border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-lg transition-all" title="Düzenle">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-white border border-slate-200 shadow-sm hover:shadow hover:border-red-300 text-slate-500 hover:text-red-600 rounded-lg transition-all" title="Sil">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* GRID VIEW (CARDS) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {items.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative group overflow-hidden">
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex gap-1 z-10">
                                <button
                                    onClick={() => { setEditItem(item); setIsDialogOpen(true); }}
                                    className="p-2 bg-white text-blue-600 rounded-lg shadow-md border border-slate-100 hover:bg-blue-50 transition-colors"
                                    title="Düzenle"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-white text-red-600 rounded-lg shadow-md border border-slate-100 hover:bg-red-50 transition-colors"
                                    title="Sil"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Avatar & Name */}
                            <div className="flex items-start gap-4 mb-4 relative z-0">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shadow-inner border border-blue-50">
                                    {item.ad_soyad?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h3 className="font-bold text-slate-800 text-base truncate" title={item.ad_soyad}>{item.ad_soyad}</h3>
                                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide truncate mt-0.5">
                                        {item.unvan || "Unvan Yok"}
                                    </div>
                                </div>
                            </div>

                            {/* Info List */}
                            <div className="space-y-2.5 relative z-0">
                                {item.telefon && (
                                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50/30 transition-colors">
                                        <Phone className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                        <span className="text-sm font-mono font-medium text-slate-700 select-all">{item.telefon}</span>
                                    </div>
                                )}

                                {item.dahili && (
                                    <div className="flex items-center gap-2 pl-2">
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded border border-slate-200">DAHİLİ</span>
                                        <span className="font-mono text-sm font-bold text-slate-700 select-all">{item.dahili}</span>
                                    </div>
                                )}

                                {item.kurum && (
                                    <div className="flex items-center gap-3 pl-2 pt-1">
                                        <Building className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-xs text-slate-600 truncate" title={item.kurum}>{item.kurum}</span>
                                    </div>
                                )}

                                {item.email && (
                                    <div className="flex items-center gap-3 pl-2">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <a href={`mailto:${item.email}`} className="text-xs text-blue-600 hover:text-blue-700 hover:underline truncate transition-colors">{item.email}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                    }
                </div>
            )}

            <RehberDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
