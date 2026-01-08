"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, CheckCircle2, Clock, XCircle, AlertCircle, Filter } from "lucide-react";
import TalimatDialog from "./TalimatDialog";

export default function TalimatTable() {
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

            const res = await fetch(`/api/talimatlar?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [search, statusFilter]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/talimatlar/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Tamamlandı": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case "Devam Ediyor": return <Clock className="w-5 h-5 text-amber-500" />;
            case "İptal": return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <AlertCircle className="w-5 h-5 text-slate-400" />; // Beklemede
        }
    };

    const getImportanceClass = (imp: string) => {
        switch (imp) {
            case "Çok Acil": return "bg-red-100 text-red-700 border-red-200";
            case "Acil": return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Talimatlar</h1>
                    <p className="text-slate-500">Valilik Tarafından Verilen Talimatların Takibi</p>
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
                            <option value="Beklemede">Beklemede</option>
                            <option value="Devam Ediyor">Devam Ediyor</option>
                            <option value="Tamamlandı">Tamamlandı</option>
                            <option value="İptal">İptal</option>
                        </select>
                    </div>

                    <input
                        type="text"
                        placeholder="Talimat/Kişi Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white w-64"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Talimat Ekle
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-500">Yükleniyor...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">Talimat bulunamadı.</div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start gap-4">
                            <div className="flex gap-4 w-full">
                                <div className="mt-1">{getStatusIcon(item.durum)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-slate-800 text-lg truncate">{item.konu}</h3>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getImportanceClass(item.onem_derecesi)}`}>
                                            {item.onem_derecesi}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{item.icerik || "İçerik girilmemiş."}</p>

                                    <div className="flex items-center gap-6 text-xs text-slate-500">
                                        <div>
                                            <span className="font-semibold text-slate-700">Verilen:</span> {item.verilen_kisi}
                                            {item.kurum && <span className="text-slate-400"> ({item.kurum})</span>}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-700">Tarih:</span> {item.tarih}
                                        </div>
                                        {item.durum === "Tamamlandı" && item.tamamlanma_tarihi && (
                                            <div className="text-green-600 font-medium">
                                                Tamamlandı: {item.tamamlanma_tarihi}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <TalimatDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
