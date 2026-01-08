"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, CalendarDays, Clock, Plus, ChevronLeft, ChevronRight, Sparkles, MapPin, Users } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import ProgramDialog from "./ProgramDialog";

dayjs.locale("tr");

interface ProgramItem {
    id: number;
    saat: string;
    tur: string;
    aciklama: string;
    yer?: string;
    katilimci?: number;
}

export default function ProgramTable() {
    const [items, setItems] = useState<ProgramItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [editItem, setEditItem] = useState<ProgramItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedDate) params.append("date", selectedDate);
            const res = await fetch(`/api/gunluk-program?${params.toString()}`);
            const json = await res.json();
            setItems(json.data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [selectedDate]);

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await fetch(`/api/gunluk-program/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const goToPrevDay = () => setSelectedDate(dayjs(selectedDate).subtract(1, "day").format("YYYY-MM-DD"));
    const goToNextDay = () => setSelectedDate(dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD"));
    const goToToday = () => setSelectedDate(dayjs().format("YYYY-MM-DD"));

    const isToday = dayjs(selectedDate).isSame(dayjs(), "day");

    const getTypeConfig = (type?: string) => {
        switch (type?.toLowerCase()) {
            case "toplantı":
                return {
                    gradient: "from-blue-500 to-indigo-600",
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    text: "text-blue-700",
                    icon: "🗣️",
                    glow: "shadow-blue-500/20"
                };
            case "ziyaret":
                return {
                    gradient: "from-emerald-500 to-teal-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                    text: "text-emerald-700",
                    icon: "🤝",
                    glow: "shadow-emerald-500/20"
                };
            case "tören":
                return {
                    gradient: "from-rose-500 to-pink-600",
                    bg: "bg-rose-50",
                    border: "border-rose-200",
                    text: "text-rose-700",
                    icon: "🎖️",
                    glow: "shadow-rose-500/20"
                };
            case "etkinlik":
                return {
                    gradient: "from-amber-500 to-orange-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    text: "text-amber-700",
                    icon: "🎉",
                    glow: "shadow-amber-500/20"
                };
            case "randevu":
                return {
                    gradient: "from-purple-500 to-violet-600",
                    bg: "bg-purple-50",
                    border: "border-purple-200",
                    text: "text-purple-700",
                    icon: "📅",
                    glow: "shadow-purple-500/20"
                };
            default:
                return {
                    gradient: "from-slate-500 to-slate-600",
                    bg: "bg-slate-50",
                    border: "border-slate-200",
                    text: "text-slate-700",
                    icon: "📋",
                    glow: "shadow-slate-500/20"
                };
        }
    };

    // Skeleton loader
    const SkeletonItem = () => (
        <div className="flex gap-6 animate-pulse">
            <div className="w-20 h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-4 h-4 bg-slate-300 rounded-full mt-2"></div>
            <div className="flex-1 space-y-3">
                <div className="h-24 bg-slate-200 rounded-2xl"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <span className="text-sm font-medium text-white/80">Sayın Valimizin</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                                Günlük Program
                            </h1>
                            <p className="text-white/70 text-lg">
                                {dayjs(selectedDate).format("DD MMMM YYYY, dddd")}
                            </p>
                        </div>

                        {/* Date Navigation */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={goToPrevDay}
                                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all hover:scale-105"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <CalendarDays className="w-5 h-5" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent border-none text-white font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
                                />
                            </div>

                            <button
                                onClick={goToNextDay}
                                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all hover:scale-105"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {!isToday && (
                                <button
                                    onClick={goToToday}
                                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-medium hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                                >
                                    Bugün
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-white/20">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold">{items.length}</span>
                            <span className="text-white/70">Program</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Users className="w-4 h-4" />
                            <span className="font-semibold">{items.filter(i => i.tur?.toLowerCase() === "toplantı").length}</span>
                            <span className="text-white/70">Toplantı</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <MapPin className="w-4 h-4" />
                            <span className="font-semibold">{items.filter(i => i.tur?.toLowerCase() === "ziyaret").length}</span>
                            <span className="text-white/70">Ziyaret</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                    className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/25 font-medium"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Yeni Program Ekle
                </button>
            </div>

            {/* Timeline Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 lg:p-8">
                    {loading ? (
                        <div className="space-y-6">
                            <SkeletonItem />
                            <SkeletonItem />
                            <SkeletonItem />
                        </div>
                    ) : items.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-16">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                                <CalendarDays className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">
                                Program Bulunamadı
                            </h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                {dayjs(selectedDate).format("DD MMMM YYYY")} tarihinde planlanmış herhangi bir program bulunmamaktadır.
                            </p>
                            <button
                                onClick={() => { setEditItem(null); setIsDialogOpen(true); }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                İlk Programı Ekle
                            </button>
                        </div>
                    ) : (
                        /* Timeline */
                        <div className="relative">
                            {/* Vertical Timeline Line */}
                            <div className="absolute left-[100px] top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full hidden lg:block"></div>

                            <div className="space-y-1">
                                {items.map((item, index) => {
                                    const config = getTypeConfig(item.tur);
                                    const isHovered = hoveredId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className="relative group"
                                            onMouseEnter={() => setHoveredId(item.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            {/* Desktop Layout */}
                                            <div className="hidden lg:flex items-start gap-6">
                                                {/* Time */}
                                                <div className="w-[76px] flex-shrink-0 text-right pt-4">
                                                    <div className={`inline-flex items-center justify-center px-3 py-2 rounded-xl font-mono text-lg font-bold transition-all duration-300 ${isHovered
                                                            ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg ${config.glow}`
                                                            : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {item.saat}
                                                    </div>
                                                </div>

                                                {/* Timeline Node */}
                                                <div className="relative flex flex-col items-center z-10">
                                                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg transition-all duration-300 flex items-center justify-center text-xs ${isHovered
                                                            ? `bg-gradient-to-r ${config.gradient} scale-125`
                                                            : 'bg-slate-300'
                                                        }`}>
                                                        {isHovered && <span className="text-white">{config.icon}</span>}
                                                    </div>
                                                </div>

                                                {/* Card */}
                                                <div className={`flex-1 mb-6 transition-all duration-300 ease-out ${isHovered ? 'transform -translate-y-1' : ''
                                                    }`}>
                                                    <div className={`relative p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${isHovered
                                                            ? `${config.bg} ${config.border} shadow-xl ${config.glow}`
                                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                                        }`}>
                                                        {/* Gradient overlay on hover */}
                                                        <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-5' : ''
                                                            }`}></div>

                                                        <div className="relative z-10">
                                                            {/* Header */}
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${config.gradient} text-white shadow-sm`}>
                                                                        {config.icon} {item.tur || "Program"}
                                                                    </span>
                                                                </div>

                                                                {/* Actions */}
                                                                <div className={`flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                                                                    }`}>
                                                                    <button
                                                                        onClick={() => { setEditItem(item); setIsDialogOpen(true); }}
                                                                        className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 text-blue-600 transition-all hover:scale-110"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(item.id)}
                                                                        className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-red-50 text-red-600 transition-all hover:scale-110"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <p className={`text-lg font-medium leading-relaxed transition-colors ${isHovered ? config.text : 'text-slate-800'
                                                                }`}>
                                                                {item.aciklama}
                                                            </p>

                                                            {/* Additional Info - Shows on hover */}
                                                            <div className={`mt-4 pt-4 border-t border-slate-200/50 flex gap-4 transition-all duration-300 ${isHovered ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
                                                                }`}>
                                                                {item.yer && (
                                                                    <div className="flex items-center gap-1 text-sm text-slate-500">
                                                                        <MapPin className="w-4 h-4" />
                                                                        {item.yer}
                                                                    </div>
                                                                )}
                                                                {item.katilimci && (
                                                                    <div className="flex items-center gap-1 text-sm text-slate-500">
                                                                        <Users className="w-4 h-4" />
                                                                        {item.katilimci} Katılımcı
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Layout */}
                                            <div className="lg:hidden">
                                                <div className="flex gap-4 pb-6">
                                                    {/* Timeline */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${config.gradient}`}></div>
                                                        {index !== items.length - 1 && (
                                                            <div className="w-0.5 flex-1 bg-gradient-to-b from-indigo-300 to-purple-300"></div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 -mt-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${config.gradient} text-white`}>
                                                                {item.saat}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
                                                                {item.tur || "Program"}
                                                            </span>
                                                        </div>
                                                        <div className={`p-4 rounded-xl ${config.bg} border ${config.border}`}>
                                                            <p className={`${config.text} font-medium`}>{item.aciklama}</p>
                                                            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-200/50">
                                                                <button
                                                                    onClick={() => { setEditItem(item); setIsDialogOpen(true); }}
                                                                    className="text-blue-600 text-sm font-medium"
                                                                >
                                                                    Düzenle
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="text-red-600 text-sm font-medium"
                                                                >
                                                                    Sil
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ProgramDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={fetchData} initialData={editItem} />
        </div>
    );
}
