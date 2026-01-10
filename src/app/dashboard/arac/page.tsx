"use client";

import AracTable from "@/components/arac/AracTable";
import { Sparkles, Car } from "lucide-react";

export default function AracPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 animate-gradient-x rounded-2xl p-6 shadow-2xl border border-white/5">

        {/* Header Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-white/80">Ulaşım Hizmetleri</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Araç Planlama</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Kurum araçlarının görevlendirme, bakım ve takip işlemleri.
          </p>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <AracTable />
      </div>
    </div>
  );
}
