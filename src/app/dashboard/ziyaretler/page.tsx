"use client";

import { useState } from "react";
import KamuTable from "@/components/ziyaretler/KamuTable";
import SehitGaziTable from "@/components/ziyaretler/SehitGaziTable";
import { Users, Medal } from "lucide-react";

export default function ZiyaretlerPage() {
    const [activeTab, setActiveTab] = useState<"kamu" | "sehit-gazi">("kamu");

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Ziyaret Kayıtları</h1>

            <div className="flex gap-1 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("kamu")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "kamu"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Vatandaş / Kamu
                </button>
                <button
                    onClick={() => setActiveTab("sehit-gazi")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "sehit-gazi"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Medal className="w-4 h-4" />
                    Şehit ve Gazi Yakınları
                </button>
            </div>

            {activeTab === "kamu" ? <KamuTable /> : <SehitGaziTable />}
        </div>
    );
}
