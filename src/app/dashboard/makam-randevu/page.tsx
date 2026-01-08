"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import RandevuTable from "@/components/makam-randevu/RandevuTable";
import RandevuDialog from "@/components/makam-randevu/RandevuDialog";

export default function MakamRandevuPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setRefreshKey((prev) => prev + 1);
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Makam Randevu</h1>
                    <p className="text-slate-500">Randevu kayıtları ve yönetim ekranı</p>
                </div>
                <button
                    onClick={() => setIsDialogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    <span>Yeni Randevu</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <RandevuTable key={refreshKey} />
            </div>

            <RandevuDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
