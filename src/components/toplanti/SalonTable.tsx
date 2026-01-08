"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, MapPin, Users } from "lucide-react";
import SalonDialog from "./SalonDialog";

export default function SalonTable() {
    const [salonlar, setSalonlar] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/toplanti-salonu");
            const json = await res.json();
            setSalonlar(json.data || []);
        } catch (error) {
            console.error("Salonlar yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu salonu silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/toplanti-salonu/${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-medium"
                >
                    + Yeni Salon Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 text-center py-8 text-slate-500">Yükleniyor...</div>
                ) : salonlar.map(salon => (
                    <div key={salon.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-slate-800">{salon.ad}</h3>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditItem(salon); setIsDialogOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(salon.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                {salon.konum || "Konum belirtilmemiş"}
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                {salon.kapasite ? `${salon.kapasite} Kişilik` : "Kapasite belirtilmemiş"}
                            </div>
                        </div>

                        {salon.ekipman && (
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ekipmanlar</span>
                                <p className="text-sm text-slate-700 mt-1 line-clamp-2">{salon.ekipman}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <SalonDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => { fetchData(); setEditItem(null); }}
                initialData={editItem}
            />
        </div>
    );
}
