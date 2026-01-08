"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, ListOrdered, Mail, Phone } from "lucide-react";
import ProtokolDialog from "./ProtokolDialog";

export default function ProtokolTable() {
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
            const res = await fetch(`/api/protokol?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/protokol/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Protokol Listesi</h1>
                    <p className="text-slate-500">İl Protokol Listesi ve İletişim Bilgileri</p>
                </div>

                <div className="flex gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        + Kayıt Ekle
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3 w-20 text-center">Sıra</th>
                            <th className="px-6 py-3">Adı Soyadı</th>
                            <th className="px-6 py-3">Unvan / Kurum</th>
                            <th className="px-6 py-3">İletişim</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">
                                            {item.sira_no}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{item.ad_soyad}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-800">{item.unvan}</div>
                                        <div className="text-slate-500 text-xs">{item.kurum}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-slate-600 text-xs">
                                            {item.telefon && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.telefon}</div>}
                                            {item.eposta && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {item.eposta}</div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ProtokolDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
