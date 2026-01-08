"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function HareketTable() {
    const [hareketler, setHareketler] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stok/hareket")
            .then(r => r.json())
            .then(d => {
                setHareketler(d.data || []);
                setLoading(false);
            })
            .catch(e => console.error(e));
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                        <th className="px-6 py-3">Tarih</th>
                        <th className="px-6 py-3">Stok Adı</th>
                        <th className="px-6 py-3">İşlem</th>
                        <th className="px-6 py-3">Miktar</th>
                        <th className="px-6 py-3">İlgili Kişi</th>
                        <th className="px-6 py-3">İşleyen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {hareketler.map(h => (
                        <tr key={h.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-500">{h.tarih}</td>
                            <td className="px-6 py-4 font-medium text-slate-800">
                                {h.adi} <span className="text-slate-400 font-normal ml-1">({h.cesit})</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`flex items-center gap-1 font-medium ${h.tur === "Giriş" ? "text-emerald-600" : "text-amber-600"}`}>
                                    {h.tur === "Giriş" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    {h.tur}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">{h.miktar}</td>
                            <td className="px-6 py-4 text-slate-600">
                                {h.tur === "Giriş" ? h.alinan : h.verilen}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">{h.personel}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
