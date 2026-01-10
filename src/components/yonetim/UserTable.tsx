"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Shield, User, Lock, Grid, List as ListIcon, CheckCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import UserDialog from "./UserDialog";

export default function UserTable() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/yonetim`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredItems = items.filter(item =>
        (item.kadi?.toLowerCase().includes(search.toLowerCase())) ||
        (item.ad_soyad?.toLowerCase().includes(search.toLowerCase()))
    );

    const openDeleteDialog = (id: number) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        try {
            await fetch(`/api/yonetim/${deleteId}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
        finally {
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toolbar Area */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        placeholder="Kullanıcı Adı veya İsim Ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* View Toggles */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            title="Liste Görünümü"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            title="Kart Görünümü"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Kullanıcı Ekle
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Yükleniyor...</div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <User className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-lg font-medium">Kullanıcı bulunamadı</p>
                </div>
            ) : viewMode === "list" ? (
                /* LIST VIEW */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Kullanıcı</th>
                                <th className="px-6 py-4">Adı Soyadı</th>
                                <th className="px-6 py-4">Yetki</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200/60 font-bold">{item.kadi}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 font-medium">{item.ad_soyad || "-"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${item.yetki === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                            {item.yetki === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                            {item.yetki.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 transform translate-x-2 sm:group-hover:translate-x-0">
                                            <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-2 bg-white border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-lg transition-all" title="Düzenle">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openDeleteDialog(item.id)} className="p-2 bg-white border border-slate-200 shadow-sm hover:shadow hover:border-red-300 text-slate-500 hover:text-red-600 rounded-lg transition-all" title="Sil">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative group overflow-hidden">
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex gap-1 z-10">
                                <button onClick={() => { setEditItem(item); setIsDialogOpen(true); }} className="p-2 bg-white text-blue-600 rounded-lg shadow-md border border-slate-100 hover:bg-blue-50 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => openDeleteDialog(item.id)} className="p-2 bg-white text-red-600 rounded-lg shadow-md border border-slate-100 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="flex flex-col items-center text-center relative z-0 mt-2">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-inner border ${item.yetki === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    {item.yetki === 'admin' ? <Shield className="w-8 h-8" /> : <User className="w-8 h-8" />}
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1">{item.kadi}</h3>
                                <p className="text-sm text-slate-500 font-medium mb-3">{item.ad_soyad || "İsimsiz Kullanıcı"}</p>

                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.yetki === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    {item.yetki === 'admin' && <Lock className="w-3 h-3" />}
                                    {item.yetki.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <UserDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />

            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setDeleteId(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Kullanıcıyı Sil"
                message="Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="Vazgeç"
                variant="danger"
            />
        </div>
    );
}
