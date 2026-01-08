"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, MapPin, Building, Star } from "lucide-react";
import VipDialog from "./VipDialog";

export default function VipTable() {
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
            const res = await fetch(`/api/vip-ziyaret?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/vip-ziyaret/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Üst Düzey Ziyaretler</h1>
                    <p className="text-slate-500">Bakan, Müsteşar ve VIP Heyet Ziyaretleri</p>
                </div>

                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white w-64"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        <Star className="w-4 h-4" />
                        + VIP Ziyaret
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-10 text-center text-slate-500">Yükleniyor...</div>
                ) : items.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-500">Kayıt bulunamadı.</div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-1.5 bg-slate-100 text-blue-600 rounded hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-slate-100 text-red-600 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{item.protokol_turu || "MİSAFİR"}</span>
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg mb-1">{item.ad_soyad}</h3>
                            <div className="text-sm text-slate-500 mb-4 font-mono">{item.gelis_tarihi} {item.gelis_saati}</div>

                            <div className="space-y-2 text-sm text-slate-700 border-t border-slate-50 pt-3">
                                {item.karsilama_yeri && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span>{item.karsilama_yeri}</span>
                                    </div>
                                )}
                                {item.konaklama_yeri && (
                                    <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-slate-400" />
                                        <span>{item.konaklama_yeri}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <VipDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
