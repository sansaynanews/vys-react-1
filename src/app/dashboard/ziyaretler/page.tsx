"use client";

import { useState } from "react";
import KamuTable from "@/components/ziyaretler/KamuTable";
import SehitGaziTable from "@/components/ziyaretler/SehitGaziTable";
import { Users, Medal, Sparkles } from "lucide-react";

export default function ZiyaretlerPage() {
    const [activeTab, setActiveTab] = useState<"kamu" | "sehit-gazi">("kamu");

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4">
            {/* Premium Header Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 animate-gradient-x rounded-2xl p-6 shadow-2xl border border-white/5">

                {/* Header Content */}
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium text-white/80">Halkla İlişkiler</span>
                        </div>
                        <h1 className="text-xl lg:text-2xl font-bold text-white">Ziyaret Kayıtları</h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Vatandaş, kamu personeli ve şehit/gazi yakını ziyaret kayıtları.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab("kamu")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "kamu"
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Vatandaş / Kamu
                        </button>
                        <button
                            onClick={() => setActiveTab("sehit-gazi")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "sehit-gazi"
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Medal className="w-4 h-4" />
                            Şehit ve Gazi Yakınları
                        </button>
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {activeTab === "kamu" ? <KamuTable /> : <SehitGaziTable />}
            </div>
        </div>
    );
}
