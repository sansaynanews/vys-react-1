"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, FileText, CheckCircle2 } from "lucide-react";
import EvrakDialog from "./EvrakDialog";

export default function EvrakTable() {
    const [evraklar, setEvraklar] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const res = await fetch(`/api/evrak?${params.toString()}`);
            const json = await res.json();
            setEvraklar(json.data || []);
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
        if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/evrak/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Evrak Yönetimi</h1>
                    <p className="text-slate-500">Gelen-Giden evrak ve dilekçe takibi</p>
                </div>

                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Ara (Konu, Sayı, Kurum)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Evrak Kayıt
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Geliş Tarihi</th>
                            <th className="px-6 py-3">Evrak No</th>
                            <th className="px-6 py-3">Kurum</th>
                            <th className="px-6 py-3">Konu</th>
                            <th className="px-6 py-3">Durum</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Yükleniyor...</td></tr>
                        ) : evraklar.length === 0 ? (
                            <tr><td colSpan={6} className="p-6 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                        ) : (
                            evraklar.map(item => {
                                const isPresented = !!item.sunus_tarihi;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.gelis_tarih}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{item.evrak_sayi || "-"}</td>
                                        <td className="px-6 py-4 text-slate-700">{item.gelen_kurum || "-"}</td>
                                        <td className="px-6 py-4 text-slate-800 font-medium max-w-xs truncate" title={item.konu}>
                                            {item.konu}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isPresented ? (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold w-fit">
                                                    <CheckCircle2 className="w-3 h-3" /> Sunuldu
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold w-fit">
                                                    <FileText className="w-3 h-3" /> İşlemde
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <EvrakDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={fetchData}
                initialData={editItem}
            />
        </div>
    );
}
