"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Shield, Heart, Filter } from "lucide-react";
import BilgiDialog from "./BilgiDialog";

export default function BilgiTable() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("Tümü");
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (typeFilter !== "Tümü") params.append("type", typeFilter);

            const res = await fetch(`/api/sehit-gazi-bilgi?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search, typeFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/sehit-gazi-bilgi/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Şehit / Gazi Bilgi Bankası</h1>
                    <p className="text-slate-500">Kayıtlı Şehit ve Gazilerimizin Detaylı Bilgileri</p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 py-2 cursor-pointer"
                        >
                            <option value="Tümü">Tümü</option>
                            <option value="Şehit">Şehit</option>
                            <option value="Gazi">Gazi</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder="Ad Soyad, Aile Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Kayıt Ekle
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Tür</th>
                            <th className="px-6 py-3">Adı Soyadı</th>
                            <th className="px-6 py-3">Olay Bilgileri</th>
                            <th className="px-6 py-3">Aile Bilgileri</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr> :
                            items.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">Kayıt bulunamadı.</td></tr> :
                                items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            {item.tur === "Şehit" ? (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-100 text-red-700 font-semibold w-fit">
                                                    <Heart className="w-3.5 h-3.5 fill-current" /> Şehit
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-100 text-blue-700 font-semibold w-fit">
                                                    <Shield className="w-3.5 h-3.5 fill-current" /> Gazi
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{item.ad_soyad}</div>
                                            <div className="text-xs text-slate-500">Baba: {item.baba_ad || "-"} / Anne: {item.anne_ad || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700">{item.olay_yeri || "-"}</div>
                                            <div className="text-xs text-slate-500">{item.olay_tarih || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-600">
                                                <span className="font-semibold">Eş:</span> {item.es_ad || "-"}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                <span className="font-semibold">Çocuklar ({item.cocuk_sayisi || 0}):</span> <span className="truncate max-w-[150px] inline-block align-bottom" title={item.cocuk_adlari}>{item.cocuk_adlari || "-"}</span>
                                            </div>
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

            <BilgiDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
