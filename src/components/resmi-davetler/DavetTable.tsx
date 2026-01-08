"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Calendar, MapPin, Filter } from "lucide-react";
import DavetDialog from "./DavetDialog";

export default function DavetTable() {
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

            const res = await fetch(`/api/resmi-davetler?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search, statusFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/resmi-davetler/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Katılacak": return "bg-green-100 text-green-700";
            case "Katılmayacak": return "bg-red-100 text-red-700";
            case "Temsilci": return "bg-blue-100 text-blue-700";
            default: return "bg-slate-100 text-slate-700"; // Belirsiz
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Resmi Davetler</h1>
                    <p className="text-slate-500">Gelen Düğün, Açılış ve Resmi Davetiyeler</p>
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
                            <option value="Belirsiz">Belirsiz</option>
                            <option value="Katılacak">Katılacak</option>
                            <option value="Katılmayacak">Katılmayacak</option>
                            <option value="Temsilci">Temsilci</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder="Davet Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Davet Ekle
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Etkinlik Tarihi</th>
                            <th className="px-6 py-3">Davet Sahibi</th>
                            <th className="px-6 py-3">Yer/Mekan</th>
                            <th className="px-6 py-3">Katılım Durumu</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr> :
                            items.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">Kayıt yok.</td></tr> :
                                items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1 font-mono text-xs text-slate-700 font-bold">
                                                    <Calendar className="w-3 h-3" /> {item.tarih}
                                                </div>
                                                <div className="text-xs text-slate-500 pl-4">{item.saat}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{item.sahip}</div>
                                            <div className="text-xs text-slate-500">{item.tur}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {item.yer || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(item.katilim_durumu)}`}>
                                                {item.katilim_durumu}
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

            <DavetDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
