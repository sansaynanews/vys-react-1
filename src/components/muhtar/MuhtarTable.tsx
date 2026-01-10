"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Phone, Mail, MapPin, User, Grid, List as ListIcon } from "lucide-react";
import MuhtarDialog from "./MuhtarDialog";

export default function MuhtarTable() {
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
            const res = await fetch(`/api/muhtar?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) {
            console.error("Yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/muhtar/${id}`, { method: "DELETE" });
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
                        placeholder="İsim, İlçe veya Mahalle Ara..."
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
                        Yeni Kayıt
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Yükleniyor...</div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <User className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-lg font-medium">Kayıt bulunamadı</p>
                </div>
            ) : viewMode === "list" ? (
                /* LIST VIEW (TABLE) */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-16"></th>
                                    <th className="px-6 py-4 font-semibold">Adı Soyadı</th>
                                    <th className="px-6 py-4 font-semibold">Bölge (İlçe / Mahalle)</th>
                                    <th className="px-6 py-4 font-semibold">İletişim</th>
                                    <th className="px-4 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((muhtar) => (
                                    <tr key={muhtar.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                                {muhtar.foto ? (
                                                    <img src={muhtar.foto} alt={muhtar.ad_soyad} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{muhtar.ad_soyad}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-slate-700 font-medium">
                                                    {muhtar.ilce} <span className="text-slate-400 px-1">/</span> {muhtar.mahalle_koy}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {muhtar.gsm && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-mono text-xs text-slate-700">{muhtar.gsm}</span>
                                                    </div>
                                                )}
                                                {muhtar.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                        <a href={`mailto:${muhtar.email}`} className="text-xs text-blue-600 hover:underline">{muhtar.email}</a>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 transform translate-x-2 sm:group-hover:translate-x-0">
                                                <button onClick={() => { setEditItem(muhtar); setIsDialogOpen(true); }} className="p-2 bg-white border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-lg transition-all" title="Düzenle">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(muhtar.id)} className="p-2 bg-white border border-slate-200 shadow-sm hover:shadow hover:border-red-300 text-slate-500 hover:text-red-600 rounded-lg transition-all" title="Sil">
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
                    {items.map((muhtar) => (
                        <div key={muhtar.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative group overflow-hidden">
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex gap-1 z-10">
                                <button
                                    onClick={() => { setEditItem(muhtar); setIsDialogOpen(true); }}
                                    className="p-2 bg-white text-blue-600 rounded-lg shadow-md border border-slate-100 hover:bg-blue-50 transition-colors"
                                    title="Düzenle"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(muhtar.id)}
                                    className="p-2 bg-white text-red-600 rounded-lg shadow-md border border-slate-100 hover:bg-red-50 transition-colors"
                                    title="Sil"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center relative z-0 mt-4">
                                <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-slate-400 overflow-hidden shrink-0 mb-3 group-hover:scale-105 transition-transform duration-300 relative">
                                    {muhtar.foto ? (
                                        <img src={muhtar.foto} alt={muhtar.ad_soyad} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 opacity-50" />
                                    )}
                                    <div className="absolute inset-0 rounded-full border border-black/5 pointer-events-none"></div>
                                </div>

                                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-3">{muhtar.ad_soyad}</h3>

                                <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-3 w-full flex items-center justify-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                                    <div className="text-sm font-medium text-slate-700 truncate">
                                        {muhtar.ilce}
                                        <span className="text-slate-300 mx-1">/</span>
                                        {muhtar.mahalle_koy}
                                    </div>
                                </div>

                                <div className="w-full space-y-2 pt-1">
                                    {muhtar.gsm && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono bg-slate-50/50 py-1 rounded">
                                            <Phone className="w-3 h-3 text-slate-400" />
                                            <span>{muhtar.gsm}</span>
                                        </div>
                                    )}
                                    {muhtar.email && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                            <Mail className="w-3 h-3 text-slate-400" />
                                            <a href={`mailto:${muhtar.email}`} className="truncate max-w-[200px] hover:text-blue-600 transition-colors">{muhtar.email}</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <MuhtarDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => { fetchData(); setEditItem(null); }}
                initialData={editItem}
            />
        </div>
    );
}
