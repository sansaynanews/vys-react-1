"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { Edit2, Trash2, Search, Calendar, Clock, MapPin } from "lucide-react";
import RezervasyonDialog from "./RezervasyonDialog";

dayjs.locale("tr");

export default function RezervasyonTable() {
    const [rezervasyonlar, setRezervasyonlar] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Filtreler
    const [search, setSearch] = useState("");
    const [salonId, setSalonId] = useState("");
    const [date, setDate] = useState(dayjs().format("YYYY-MM-DD")); // Varsayılan bugün

    const [salonList, setSalonList] = useState<any[]>([]);

    useEffect(() => {
        // Salon listesi
        fetch("/api/toplanti-salonu").then(r => r.json()).then(d => setSalonList(d.data || []));
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (salonId) params.append("salon_id", salonId);
            if (date) params.append("bas_tarih", date);

            const res = await fetch(`/api/salon-rezervasyon?${params.toString()}`);
            const json = await res.json();
            setRezervasyonlar(json.data || []);
        } catch (error) {
            console.error("Rezervasyonlar yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, salonId, date]);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu rezervasyonu silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/salon-rezervasyon/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Silinemedi");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {/* Filtreler */}
            <div className="flex flex-wrap gap-4 mb-4">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                />
                <select
                    value={salonId}
                    onChange={(e) => setSalonId(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                >
                    <option value="">Tüm Salonlar</option>
                    {salonList.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                </select>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Başlık ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 px-3 py-2 border rounded-lg text-sm"
                    />
                </div>
                <button
                    onClick={() => {
                        setEditItem(null);
                        setIsDialogOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    + Yeni Rezervasyon
                </button>
            </div>

            {/* Liste */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Saat / Salon</th>
                            <th className="px-6 py-3">Başlık / Konu</th>
                            <th className="px-6 py-3">Sorumlu</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">Yükleniyor...</td></tr>
                        ) : rezervasyonlar.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">Kayıt yok.</td></tr>
                        ) : (
                            rezervasyonlar.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                                                <Clock className="w-3 h-3 text-blue-500" />
                                                {item.bas_saat} - {item.bit_saat}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {item.salon_ad}
                                            </div>
                                            <div className="text-[10px] text-slate-400">{dayjs(item.tarih).format("D MMMM dddd")}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{item.baslik}</div>
                                        <div className="text-xs text-slate-500">{item.tur}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-800">{item.rez_sahibi}</div>
                                        <div className="text-xs text-slate-500">{item.departman}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <RezervasyonDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => { fetchData(); setEditItem(null); }}
                initialData={editItem}
            />
        </div>
    );
}
