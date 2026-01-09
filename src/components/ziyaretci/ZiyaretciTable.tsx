"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, LogOut, UserCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import dayjs from "dayjs";
import ZiyaretciDialog from "./ZiyaretciDialog";

export default function ZiyaretciTable() {
    const [ziyaretciler, setZiyaretciler] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [search, setSearch] = useState("");

    // Dialog
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [checkoutId, setCheckoutId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (selectedDate) params.append("date", selectedDate);

            const res = await fetch(`/api/ziyaretci?${params.toString()}`);
            const json = await res.json();
            setZiyaretciler(json.data || []);
        } catch (error) {
            console.error("Yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, selectedDate]);

    const openCheckoutDialog = (id: number) => {
        setCheckoutId(id);
        setCheckoutDialogOpen(true);
    };

    const handleCheckoutConfirm = async () => {
        if (!checkoutId) return;
        try {
            await fetch(`/api/ziyaretci/${checkoutId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cikis_saati: dayjs().format("HH:mm") })
            });
            fetchData();
        } catch (error) { console.error(error); }
        finally {
            setCheckoutDialogOpen(false);
            setCheckoutId(null);
        }
    };

    const openDeleteDialog = (id: number) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            await fetch(`/api/ziyaretci/${deleteId}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
        finally {
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Ziyaretçi Kayıtları</h1>
                    <p className="text-slate-500">Günlük ziyaretçi giriş-çıkış takibi</p>
                </div>

                <div className="flex gap-4 items-center">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />

                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                        <UserCheck className="w-4 h-4" />
                        Ziyaretçi Girişi
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Saat</th>
                            <th className="px-6 py-3">Adı Soyadı</th>
                            <th className="px-6 py-3">Kurum / Ünvan</th>
                            <th className="px-6 py-3">Kişi</th>
                            <th className="px-6 py-3">Durum</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Yükleniyor...</td></tr>
                        ) : ziyaretciler.length === 0 ? (
                            <tr><td colSpan={6} className="p-6 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                        ) : (
                            ziyaretciler.map(item => {
                                const isInside = !item.cikis_saati;
                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50 ${isInside ? "bg-blue-50/30" : ""}`}>
                                        <td className="px-6 py-4 font-mono text-slate-600">
                                            {item.giris_saati}
                                            <span className="text-slate-400 mx-1">-</span>
                                            {item.cikis_saati || "--:--"}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{item.ad_soyad}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {item.kurum}
                                            {item.unvan && <span className="text-xs text-slate-400 block">{item.unvan}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold">{item.kisi_sayisi}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isInside ? (
                                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">İçeride</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">Çıkış Yaptı</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {isInside && (
                                                    <button
                                                        onClick={() => openCheckoutDialog(item.id)}
                                                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-xs hover:bg-amber-200 font-medium flex items-center gap-1"
                                                    >
                                                        <LogOut className="w-3 h-3" /> Çıkış Yap
                                                    </button>
                                                )}
                                                <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openDeleteDialog(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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

            <ZiyaretciDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={fetchData}
                initialData={editItem}
            />

            <ConfirmDialog
                open={checkoutDialogOpen}
                onClose={() => {
                    setCheckoutDialogOpen(false);
                    setCheckoutId(null);
                }}
                onConfirm={handleCheckoutConfirm}
                title="Ziyaretçi Çıkışı"
                message="Ziyaretçi çıkışını kaydetmek istiyor musunuz?"
                confirmText="Çıkış Yap"
                cancelText="Vazgeç"
                variant="warning"
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setDeleteId(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Kaydı Sil"
                message="Bu ziyaretçi kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="Vazgeç"
                variant="danger"
            />
        </div>
    );
}
