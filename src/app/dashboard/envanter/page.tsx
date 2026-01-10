"use client";

import { useState } from "react";
import { Package, History, Sparkles, Box, ArrowRightLeft } from "lucide-react";
import StokTable from "@/components/envanter/StokTable";
import HareketTable from "@/components/envanter/HareketTable";
import HareketDialog from "@/components/envanter/HareketDialog";

export default function EnvanterPage() {
  const [activeTab, setActiveTab] = useState<"stok" | "hareket">("stok");
  const [isHareketDialogOpen, setIsHareketDialogOpen] = useState(false);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 animate-gradient-x rounded-2xl p-6 shadow-2xl border border-white/5">

        {/* Header Content */}
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-white/80">Taşınır Mal Yönetimi</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Envanter Yönetimi</h1>
            <p className="text-sm text-slate-400 mt-1">
              Kurum stok takibi, malzeme giriş ve çıkış denetimi.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/10 backdrop-blur-sm self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("stok")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "stok"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Package className="w-4 h-4" />
                Stok Durumu
              </button>
              <button
                onClick={() => setActiveTab("hareket")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "hareket"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <History className="w-4 h-4" />
                Hareket Geçmişi
              </button>
            </div>

            {/* Hızlı İşlem Button */}
            <button
              onClick={() => setIsHareketDialogOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition border border-emerald-500/50"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="whitespace-nowrap">Hızlı Stok Giriş/Çıkış</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === "stok" ? <StokTable /> : <HareketTable />}
      </div>

      <HareketDialog
        open={isHareketDialogOpen}
        onOpenChange={setIsHareketDialogOpen}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
