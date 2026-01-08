"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Plus, Search, Clock, User, Building2,
  Phone, MessageSquare, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Edit2, Trash2, Sparkles,
  Users, CalendarCheck, CalendarClock, ChevronDown, ChevronUp,
  MoreHorizontal, Eye, CalendarDays, CalendarRange, List,
  LayoutList, Calendar as CalendarIcon
} from "lucide-react";
import isoWeek from "dayjs/plugin/isoWeek";
import RandevuModal from "./RandevuModal";
import RandevuCalendarView from "./RandevuCalendarView";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { cn } from "@/lib/utils";

dayjs.extend(isoWeek);
dayjs.locale("tr");

type DateRangeType = "today" | "week" | "all";

interface Randevu {
  id: number;
  ad_soyad: string | null;
  kurum: string | null;
  unvan: string | null;
  iletisim: string | null;
  amac: string | null;
  tarih: string | null;
  saat: string | null;
  durum: string | null;
  notlar: string | null;
  created_at: string | null;
}

export default function RandevuPage() {
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRandevu, setSelectedRandevu] = useState<Randevu | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"liste" | "takvim">("liste");

  // Filters
  const [search, setSearch] = useState("");
  const [filterTarih, setFilterTarih] = useState(dayjs().format("YYYY-MM-DD"));
  const [filterDurum, setFilterDurum] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeType>("today");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 25; // More items per page for table view

  useEffect(() => {
    // Only fetch if in list mode, or maybe fetch for both? For now calendar logic is separate mock.
    // Ideally calendar would fetch real data too, but user asked for mock data for now.
    if (viewMode === "liste") {
      fetchRandevular();
    }
  }, [currentPage, search, filterTarih, filterDurum, dateRange, viewMode]);

  const fetchRandevular = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (search) params.append("search", search);

      // Date range filtering
      if (dateRange === "today") {
        params.append("tarih", filterTarih);
      } else if (dateRange === "week") {
        const weekStart = dayjs().startOf("isoWeek").format("YYYY-MM-DD");
        const weekEnd = dayjs().endOf("isoWeek").format("YYYY-MM-DD");
        params.append("startDate", weekStart);
        params.append("endDate", weekEnd);
      }
      // "all" = no date filter

      if (filterDurum) params.append("durum", filterDurum);

      const response = await fetch(`/api/randevu?${params}`);
      const data = await response.json();

      if (data.data) {
        setRandevular(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Randevular getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (randevu: Randevu) => {
    setSelectedRandevu(randevu);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRandevu(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRandevu(null);
  };

  const handleSuccess = () => {
    if (viewMode === "liste") fetchRandevular();
    handleModalClose();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/randevu/${id}`, { method: "DELETE" });
      if (viewMode === "liste") fetchRandevular();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const goToPrevDay = () => setFilterTarih(dayjs(filterTarih).subtract(1, "day").format("YYYY-MM-DD"));
  const goToNextDay = () => setFilterTarih(dayjs(filterTarih).add(1, "day").format("YYYY-MM-DD"));
  const goToToday = () => {
    setFilterTarih(dayjs().format("YYYY-MM-DD"));
    setDateRange("today");
  };
  const isToday = dayjs(filterTarih).isSame(dayjs(), "day");

  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRange(range);
    setCurrentPage(1);
    if (range === "today") {
      setFilterTarih(dayjs().format("YYYY-MM-DD"));
    }
  };

  const getDateRangeLabel = () => {
    // In Calendar Mode, the component handles date label, but for header logic:
    if (viewMode === "takvim") return "Ajanda Görünümü";

    switch (dateRange) {
      case "today":
        return dayjs(filterTarih).format("DD MMMM YYYY, dddd");
      case "week":
        return `${dayjs().startOf("isoWeek").format("DD MMM")} - ${dayjs().endOf("isoWeek").format("DD MMM YYYY")}`;
      case "all":
        return "Tüm Randevular";
    }
  };

  const getDurumConfig = (durum: string | null) => {
    switch (durum) {
      case "Tamamlandı":
      case "Görüşüldü":
        return {
          gradient: "from-emerald-500 to-teal-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
          label: durum
        };
      case "Onaylandı":
        return {
          gradient: "from-blue-500 to-indigo-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          dot: "bg-blue-500",
          icon: CalendarCheck,
          label: "Onaylandı"
        };
      case "İptal":
        return {
          gradient: "from-red-500 to-rose-600",
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          dot: "bg-red-500",
          icon: XCircle,
          label: "İptal"
        };
      default:
        return {
          gradient: "from-amber-500 to-orange-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          dot: "bg-amber-500",
          icon: AlertCircle,
          label: durum || "Bekliyor"
        };
    }
  };

  // Stats - only 3 cards now
  const stats = {
    total: totalItems,
    bekliyor: randevular.filter(r => !r.durum || r.durum === "Bekliyor").length,
    tamamlandi: randevular.filter(r => r.durum === "Tamamlandı" || r.durum === "Görüşüldü").length,
  };

  // Skeleton for table rows
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-4 w-40 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-6 w-20 bg-slate-200 rounded-full"></div></td>
      <td className="px-4 py-4"><div className="h-8 w-8 bg-slate-200 rounded"></div></td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Premium Header - Navy Blue & Gray Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 rounded-2xl p-8 text-white shadow-2xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500/20 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">Makam Yönetim Sistemi</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Randevu Yönetimi
              </h1>
              <p className="text-slate-400 text-lg">
                {getDateRangeLabel()}
              </p>

              {/* View Toggles & Quick Filters */}
              <div className="flex items-center gap-4 mt-6">
                {/* View Switcher */}
                <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setViewMode("liste")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      viewMode === "liste" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <LayoutList className="w-4 h-4" />
                    Liste
                  </button>
                  <button
                    onClick={() => setViewMode("takvim")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      viewMode === "takvim" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Takvim
                  </button>
                </div>

                <div className="h-8 w-px bg-white/10"></div>

                {viewMode === "liste" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDateRangeChange("today")}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${dateRange === "today"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
                        }`}
                    >
                      <CalendarDays className={`w-4 h-4 transition-transform ${dateRange === "today" ? "scale-110" : "group-hover:scale-110"}`} />
                      <span>Bugün</span>
                    </button>
                    <button
                      onClick={() => handleDateRangeChange("week")}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${dateRange === "week"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
                        }`}
                    >
                      <CalendarRange className={`w-4 h-4 transition-transform ${dateRange === "week" ? "scale-110" : "group-hover:scale-110"}`} />
                      <span>Bu Hafta</span>
                    </button>
                    <button
                      onClick={() => handleDateRangeChange("all")}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${dateRange === "all"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
                        }`}
                    >
                      <List className={`w-4 h-4 transition-transform ${dateRange === "all" ? "scale-110" : "group-hover:scale-110"}`} />
                      <span>Tümü</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Date Navigation - Only show for "today" in list mode */}
            {viewMode === "liste" && dateRange === "today" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrevDay}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95 border border-white/10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <Calendar className="w-5 h-5 text-slate-300" />
                  <input
                    type="date"
                    value={filterTarih}
                    onChange={(e) => setFilterTarih(e.target.value)}
                    className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
                  />
                </div>

                <button
                  onClick={goToNextDay}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95 border border-white/10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
                  >
                    Bugüne Dön
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards - Only 3 now - Hide in Calendar Mode? Maybe keep for overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-sm text-slate-400">Toplam Randevu</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.bekliyor}</p>
                  <p className="text-sm text-slate-400">Bekleyen</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.tamamlandi}</p>
                  <p className="text-sm text-slate-400">Tamamlanan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA: LIST vs CALENDAR */}
      {viewMode === "takvim" ? (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <RandevuCalendarView />
        </div>
      ) : (
        <>
          {/* Actions Bar (Search/Filter/Add) - Only for list view for now */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-6">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, kurum veya konu ara..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all"
                />
              </div>

              <select
                value={filterDurum}
                onChange={(e) => { setFilterDurum(e.target.value); setCurrentPage(1); }}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all cursor-pointer"
              >
                <option value="">Tüm Durumlar</option>
                <option value="Bekliyor">Bekliyor</option>
                <option value="Onaylandı">Onaylandı</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="Görüşüldü">Görüşüldü</option>
                <option value="İptal">İptal</option>
              </select>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAdd}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-500/25 font-medium"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Yeni Randevu
            </button>
          </div>

          {/* Table View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Saat</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ad Soyad</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurum</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Konu</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : randevular.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-1">Randevu Bulunamadı</h3>
                          <p className="text-slate-500 mb-4">Bu tarihte kayıtlı randevu yok</p>
                          <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Randevu Ekle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    randevular.map((randevu) => {
                      const config = getDurumConfig(randevu.durum);
                      const isExpanded = expandedId === randevu.id;

                      return (
                        <>
                          <tr
                            key={randevu.id}
                            className={`group hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                            onClick={() => toggleExpand(randevu.id)}
                          >
                            {/* Time */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                                <span className="font-mono font-semibold text-slate-900">
                                  {randevu.saat || "--:--"}
                                </span>
                              </div>
                            </td>

                            {/* Name */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                  {randevu.ad_soyad?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{randevu.ad_soyad || "İsimsiz"}</p>
                                  {randevu.unvan && (
                                    <p className="text-xs text-slate-500">{randevu.unvan}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Organization */}
                            <td className="px-4 py-4">
                              <span className="text-slate-600">{randevu.kurum || "-"}</span>
                            </td>

                            {/* Subject */}
                            <td className="px-4 py-4">
                              <span className="text-slate-600 line-clamp-1 max-w-xs">{randevu.amac || "-"}</span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                                <config.icon className="w-3.5 h-3.5" />
                                {config.label}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleEdit(randevu)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Düzenle"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(randevu.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleExpand(randevu.id)}
                                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Detay"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr key={`${randevu.id}-details`}>
                              <td colSpan={6} className="px-4 py-4 bg-slate-50 border-b border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                                  {randevu.iletisim && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-slate-400" />
                                      <span className="text-slate-600">{randevu.iletisim}</span>
                                    </div>
                                  )}
                                  {randevu.amac && (
                                    <div className="flex items-start gap-2 text-sm md:col-span-2">
                                      <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                                      <span className="text-slate-600">{randevu.amac}</span>
                                    </div>
                                  )}
                                  {randevu.notlar && (
                                    <div className="flex items-start gap-2 text-sm md:col-span-3">
                                      <Eye className="w-4 h-4 text-slate-400 mt-0.5" />
                                      <span className="text-slate-500 italic">{randevu.notlar}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">
                  Toplam <span className="font-semibold text-slate-700">{totalItems}</span> kayıt,
                  Sayfa <span className="font-semibold text-slate-700">{currentPage}</span> / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    İlk
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                            ? 'bg-slate-800 text-white shadow-md'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Son
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}


      {/* Modal */}
      {modalOpen && (
        <RandevuModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          randevu={selectedRandevu}
        />
      )}
    </div>
  );
}
