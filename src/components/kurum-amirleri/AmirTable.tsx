"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Phone, Mail, Building, User } from "lucide-react";
import AmirDialog from "./AmirDialog";

export default function AmirTable() {
    const [amirler, setAmirler] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            const res = await fetch(`/api/kurum-amirleri?${params.toString()}`);
            const json = await res.json();
            setAmirler(json.data || []);
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
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/kurum-amirleri/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kurum Amirleri</h1>
                    <p className="text-slate-500">İlçe ve Kurum yöneticileri iletişim rehberi</p>
                </div>

                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="İsim veya Kurum Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        + Yeni Kayıt
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 text-center py-10 text-slate-500">Yükleniyor...</div>
                ) : amirler.length === 0 ? (
                    <div className="col-span-3 text-center py-10 text-slate-500">Kayıt bulunamadı.</div>
                ) : (
                    amirler.map(amir => (
                        <div key={amir.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition group relative">
                            {/* Actions (Absolute Top Right) */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded backdrop-blur-sm">
                                <button onClick={() => { setEditItem(amir); setIsDialogOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(amir.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                    {amir.foto ? (
                                        <img src={amir.foto} alt={amir.ad_soyad} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 line-clamp-1" title={amir.ad_soyad}>{amir.ad_soyad}</h3>
                                    <p className="text-sm text-blue-600 font-medium mb-1 line-clamp-1">{amir.unvan || "-"}</p>

                                    <div className="space-y-1 mt-2 mb-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Building className="w-3 h-3 shrink-0" />
                                            <span className="line-clamp-1" title={amir.kurum_adi}>{amir.kurum_adi}</span>
                                        </div>
                                        {amir.gsm && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Phone className="w-3 h-3 shrink-0" />
                                                <span>{amir.gsm}</span>
                                            </div>
                                        )}
                                        {amir.email && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Mail className="w-3 h-3 shrink-0" />
                                                <a href={`mailto:${amir.email}`} className="hover:text-blue-600">{amir.email}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AmirDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => { fetchData(); setEditItem(null); }}
                initialData={editItem}
            />
        </div>
    );
}
