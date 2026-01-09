"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import StokDialog from "./StokDialog";
import HareketDialog from "./HareketDialog";

export default function StokTable() {
    const [stoklar, setStoklar] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog States
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isStokDialogOpen, setIsStokDialogOpen] = useState(false);

    const [hareketItem, setHareketItem] = useState<any | null>(null);
    const [isHareketDialogOpen, setIsHareketDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const res = await fetch(`/api/stok?${params.toString()}`);
            const json = await res.json();
            setStoklar(json.data || []);
        } catch (error) {
            console.error("Stoklar yüklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    const openDeleteDialog = (id: number) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            await fetch(`/api/stok/${deleteId}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
        finally {
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Stok adı ara..."
                    className="px-4 py-2 border rounded-lg text-sm w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    onClick={() => { setEditItem(null); setIsStokDialogOpen(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    + Yeni Stok Kartı
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-6 py-3">Stok Adı</th>
                            <th className="px-6 py-3">Çeşit / Model</th>
                            <th className="px-6 py-3">Kategori</th>
                            <th className="px-6 py-3">Miktar</th>
                            <th className="px-6 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr>
                        ) : stoklar.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4 font-medium text-slate-800">{item.adi}</td>
                                <td className="px-6 py-4 text-slate-600">{item.cesit}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600">{item.kategori}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`flex items-center gap-2 font-bold ${item.miktar < 10 ? "text-red-600" : "text-green-600"}`}>
                                        {item.miktar < 10 && <AlertTriangle className="w-4 h-4" />}
                                        {item.miktar}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setHareketItem(item.id); setIsHareketDialogOpen(true); }}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                            title="Stok Hareketi"
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setEditItem(item); setIsStokDialogOpen(true); }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Düzenle"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteDialog(item.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <StokDialog
                open={isStokDialogOpen}
                onOpenChange={setIsStokDialogOpen}
                onSuccess={fetchData}
                initialData={editItem}
            />

            <HareketDialog
                open={isHareketDialogOpen}
                onOpenChange={setIsHareketDialogOpen}
                onSuccess={fetchData}
                preSelectedId={hareketItem}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setDeleteId(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Stok Kartını Sil"
                message="Bu stok kartını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="Vazgeç"
                variant="danger"
            />
        </div>
    );
}
