"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, BookOpen, Calendar, Filter } from "lucide-react";
import KonusmaDialog from "./KonusmaDialog";

export default function KonusmaTable() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const res = await fetch(`/api/konusma-metinleri?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/konusma-metinleri/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Konuşma Metinleri</h1>
                    <p className="text-slate-500">Vali Bey'in Konuşma Metinleri Arşivi</p>
                </div>

                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Metin Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Metin Ekle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-10 text-center text-slate-500">Yükleniyor...</div>
                ) : items.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-500">Metin bulunamadı.</div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[280px]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold mb-2">{item.kategori}</span>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2" title={item.baslik}>{item.baslik}</h3>
                                </div>
                                <div className="flex gap-2 shrink-0 ml-2">
                                    <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-mono">
                                <Calendar className="w-3.5 h-3.5" />
                                {item.tarih} {item.saat && `- ${item.saat}`}
                            </div>

                            <div className="flex-1 overflow-hidden relative mb-4 p-3 bg-slate-50 rounded border border-slate-100">
                                <p className="text-slate-600 text-sm font-serif leading-relaxed line-clamp-[6]">
                                    {item.icerik}
                                </p>
                            </div>

                            <button
                                onClick={() => { setEditItem(item); setIsDialogOpen(true); }}
                                className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 self-start mt-auto"
                            >
                                <BookOpen className="w-4 h-4" /> Tamamını Oku / Düzenle
                            </button>
                        </div>
                    ))
                )}
            </div>

            <KonusmaDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
