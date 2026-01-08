"use client";

import { useState } from "react";
import { Package, History } from "lucide-react";
import StokTable from "@/components/envanter/StokTable";
import HareketTable from "@/components/envanter/HareketTable";
import HareketDialog from "@/components/envanter/HareketDialog";

export default function EnvanterPage() {
  const [activeTab, setActiveTab] = useState<"stok" | "hareket">("stok");
  const [isHareketDialogOpen, setIsHareketDialogOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Envanter Yönetimi</h1>
          <p className="text-slate-500">Stok takibi, giriş ve çıkış işlemleri</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setIsHareketDialogOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition"
          >
            Hızlı İşlem (Stok Giriş/Çıkış)
          </button>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("stok")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "stok" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
            >
              <Package className="w-4 h-4" />
              Stok Durumu
            </button>
            <button
              onClick={() => setActiveTab("hareket")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "hareket" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
            >
              <History className="w-4 h-4" />
              Hareket Geçmişi
            </button>
          </div>
        </div>
      </div>

      {activeTab === "stok" ? <StokTable /> : <HareketTable />}

      <HareketDialog
        open={isHareketDialogOpen}
        onOpenChange={setIsHareketDialogOpen}
        onSuccess={() => window.location.reload()} // Basit refresh, aslında context veya refetch daha iyi olurdu ama tablar arası geçişte zaten refresh oluyor.
      />
    </div>
  );
}
