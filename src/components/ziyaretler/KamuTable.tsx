"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import KamuDialog from "./KamuDialog";

export default function KamuTable() {
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
            const res = await fetch(`/api/ziyaret/kamu?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/ziyaret/kamu/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex justify-end mb-4 gap-4">
                <input
                    type="text"
                    placeholder="Ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <button
                    onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    + Ziyaret Ekle
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Tarih</th>
                            <th className="px-6 py-3">Ziyaretçi</th>
                            <th className="px-6 py-3">Yer</th>
                            <th className="px-6 py-3">Talepler</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr> :
                            items.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-slate-500">Kayıt yok.</td></tr> :
                                items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-xs">{item.tarih} {item.saat}</td>
                                        <td className="px-6 py-4 font-medium">{item.kurum}</td>
                                        <td className="px-6 py-4">{item.yer}</td>
                                        <td className="px-6 py-4 max-w-xs truncate">{item.talepler}</td>
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
            <KamuDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
