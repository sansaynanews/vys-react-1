"use client";

import { useState } from "react";
import SalonTable from "@/components/toplanti/SalonTable";
import RezervasyonTable from "@/components/toplanti/RezervasyonTable";
import { LayoutList, CalendarDays } from "lucide-react";

export default function ToplantiPage() {
  const [activeTab, setActiveTab] = useState<"rezervasyon" | "salon">("rezervasyon");

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Toplantı Yönetimi</h1>
          <p className="text-slate-500">Salon rezervasyonları ve yönetimi</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("rezervasyon")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "rezervasyon" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
          >
            <CalendarDays className="w-4 h-4" />
            Rezervasyonlar
          </button>
          <button
            onClick={() => setActiveTab("salon")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "salon" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
          >
            <LayoutList className="w-4 h-4" />
            Salonlar
          </button>
        </div>
      </div>

      {activeTab === "rezervasyon" ? <RezervasyonTable /> : <SalonTable />}
    </div>
  );
}
