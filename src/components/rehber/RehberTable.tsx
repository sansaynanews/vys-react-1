"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Phone, Mail, Building } from "lucide-react";
import RehberDialog from "./RehberDialog";

export default function RehberTable() {
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Telefon Rehberi</h1>
                    <p className="text-slate-500">Kurum İçi ve Dışı İletişim Rehberi</p>
                </div>

                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Ad Soyad, Kurum Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white w-64"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Kişi Ekle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

                            <h3 className="font-bold text-slate-800 text-base mb-1 truncate pr-14">{item.ad_soyad}</h3>
                            <div className="text-xs text-slate-500 mb-3 truncate font-medium uppercase tracking-wide">{item.unvan || "UNVAN BELİRTİLMEMİŞ"}</div>

                            <div className="space-y-2 text-sm text-slate-700 border-t border-slate-50 pt-3">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="font-mono">{item.telefon}</span>
                                </div>
                                {item.dahili && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold bg-slate-100 rounded text-slate-500">D</span>
                                        <span className="font-mono text-slate-600">Dahili: {item.dahili}</span>
                                    </div>
                                )}
                                {item.kurum && (
                                    <div className="flex items-center gap-2">
                                        <Building className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate text-xs">{item.kurum}</span>
                                    </div>
                                )}
                                {item.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline truncate text-xs">{item.email}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <RehberDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
