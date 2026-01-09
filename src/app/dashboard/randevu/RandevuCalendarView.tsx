"use client";

import { useEffect, useState, useRef } from "react";
import { format, isSameDay, setHours, addDays, subDays, getHours, getMinutes, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/Calendar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays, CalendarRange, CalendarCheck, Edit2, Trash2, Building2, Users, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getStatusConfig } from "@/lib/constants";

// Real Data Interface matching page.tsx
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
    sonuc_notlari: string | null;
    talep_kaynagi: string | null;
    konuklar?: any[];
    created_at: string | null;
    katilimci?: number;
    // İş Akışı alanları
    yonlendirilen_birim: string | null;
    yonlendirme_nedeni: string | null;
    ret_gerekcesi: string | null;
    havale_edilen: string | null;
    havale_nedeni: string | null;
    iptal_gerekcesi: string | null;
    // Süre takibi alanları
    giris_saati: string | null;
    gorusme_baslangic: string | null;
    cikis_saati: string | null;
    giris_tarihi: string | null;
}

export type ViewMode = "day" | "week" | "month";

interface RandevuCalendarViewProps {
    appointments: Randevu[];
    date: Date;
    onDateChange: (date: Date) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onAddClick?: () => void;
    onEditClick?: (randevu: Randevu) => void;
    onDeleteClick?: (id: number) => void;
}

// Config - 24 Hour Format
const START_HOUR = 0;
const END_HOUR = 23;
const HOURS_COUNT = END_HOUR - START_HOUR + 1;
const HOUR_HEIGHT = 32; // px - Ultra compact mode

const getStatusStyles = (status: string | null) => {
    const config = getStatusConfig(status);
    // Use the defined colors, add hover effect. 
    // Remove border-l-4 preference to align with new design system or keep it if desired.
    // The constants define 'border-xxx-200' which is a full border.
    return `${config.color} hover:brightness-95 z-10 shadow-sm`;
};

const hours = Array.from({ length: HOURS_COUNT }, (_, i) => i + START_HOUR);

export default function RandevuCalendarView({ appointments, date, onDateChange, viewMode, onViewModeChange, onAddClick, onEditClick, onDeleteClick }: RandevuCalendarViewProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Filter appointments based on view mode
    const filteredAppointments = appointments.filter((app) => {
        if (!app.tarih) return false;
        const appDate = new Date(app.tarih);

        if (viewMode === "day") {
            return app.tarih === format(date, "yyyy-MM-dd");
        } else if (viewMode === "week") {
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            return isWithinInterval(appDate, { start: weekStart, end: weekEnd });
        } else {
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            return isWithinInterval(appDate, { start: monthStart, end: monthEnd });
        }
    }).sort((a, b) => {
        // Sort by date then time
        const dateCompare = (a.tarih || "").localeCompare(b.tarih || "");
        if (dateCompare !== 0) return dateCompare;
        return (a.saat || "").localeCompare(b.saat || "");
    });

    // Navigation handlers based on view mode
    const handlePrev = () => {
        if (viewMode === "day") onDateChange(subDays(date, 1));
        else if (viewMode === "week") onDateChange(subWeeks(date, 1));
        else onDateChange(subMonths(date, 1));
    };

    const handleNext = () => {
        if (viewMode === "day") onDateChange(addDays(date, 1));
        else if (viewMode === "week") onDateChange(addWeeks(date, 1));
        else onDateChange(addMonths(date, 1));
    };

    // Get header label based on view
    const getHeaderLabel = () => {
        if (viewMode === "day") {
            return format(date, "d MMMM yyyy, EEEE", { locale: tr });
        } else if (viewMode === "week") {
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            return `${format(weekStart, "d MMM", { locale: tr })} - ${format(weekEnd, "d MMM yyyy", { locale: tr })}`;
        } else {
            return format(date, "MMMM yyyy", { locale: tr });
        }
    };

    // Current time position
    const isToday = isSameDay(date, new Date());
    const currentHour = getHours(currentTime);
    const currentMinute = getMinutes(currentTime);

    // Calculate top position for "Now" line
    const getCurrentTimeTop = () => {
        if (currentHour < START_HOUR || currentHour > END_HOUR) return -1;
        return (currentHour - START_HOUR) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;
    };

    const timeTop = getCurrentTimeTop();

    // Calculate overlapping groups and assign columns
    const getEventsWithPositions = () => {
        // Only for day view - filter appointments for this day
        const dayAppointments = filteredAppointments.filter(app =>
            viewMode === "day" && app.tarih === format(date, "yyyy-MM-dd")
        );

        // Sort by start time
        const sorted = [...dayAppointments].sort((a, b) =>
            (a.saat || "").localeCompare(b.saat || "")
        );

        // Calculate positions
        type PositionedEvent = Randevu & { column: number; totalColumns: number };
        const positionedEvents: PositionedEvent[] = [];

        // Group events by overlapping time
        const parseTime = (saat: string | null) => {
            if (!saat) return 0;
            const [h, m] = saat.split(":").map(Number);
            return h * 60 + m;
        };

        for (const event of sorted) {
            const eventStart = parseTime(event.saat);
            const eventEnd = eventStart + 45; // Assume 45 min displayed duration for overlap check

            // Find overlapping events already positioned
            const overlapping = positionedEvents.filter(e => {
                const eStart = parseTime(e.saat);
                const eEnd = eStart + 45;
                return eventStart < eEnd && eventEnd > eStart;
            });

            // Determine which columns are taken
            const takenColumns = new Set(overlapping.map(e => e.column));

            // Find first available column
            let column = 0;
            while (takenColumns.has(column)) column++;

            positionedEvents.push({ ...event, column, totalColumns: 1 });
        }

        // Update totalColumns for each group
        for (const event of positionedEvents) {
            const eventStart = parseTime(event.saat);
            const eventEnd = eventStart + 45;

            const overlapping = positionedEvents.filter(e => {
                const eStart = parseTime(e.saat);
                const eEnd = eStart + 45;
                return eventStart < eEnd && eventEnd > eStart;
            });

            const maxColumn = Math.max(...overlapping.map(e => e.column)) + 1;
            overlapping.forEach(e => e.totalColumns = maxColumn);
        }

        return positionedEvents;
    };

    const positionedEvents = getEventsWithPositions();

    // Helper to calculate event position with column
    const getEventStyle = (appointment: Randevu & { column?: number; totalColumns?: number }) => {
        if (!appointment.saat) return { top: 0, height: 0, display: 'none' as const };
        const [hStr, mStr] = appointment.saat.split(':');
        const h = parseInt(hStr);
        const m = parseInt(mStr);

        // Calculate top relative to the list start
        const top = (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;

        // Display height - visually represent ~30-45 mins but insure text fits
        const height = Math.max(HOUR_HEIGHT * 0.6, 50);

        // Calculate width and left based on column
        const column = appointment.column ?? 0;
        const totalColumns = appointment.totalColumns ?? 1;
        const widthPercent = 100 / totalColumns;
        const leftPercent = column * widthPercent;

        return {
            top: `${top}px`,
            height: `${height}px`,
            left: `calc(${leftPercent}% + 2px)`,
            width: `calc(${widthPercent}% - 4px)`,
            // Add z-index to bring hovered items to front or rely on column order
            zIndex: 10 + column
        };
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-22rem)] min-h-[600px]">
            {/* Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && onDateChange(d)}
                        className="rounded-md w-full flex justify-center"
                        locale={tr}
                    />
                </div>

                {/* Legend */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Durumlar</h3>
                    <div className="space-y-3">
                        {["Bekliyor", "Onaylandı", "Kapıda Bekliyor", "Görüşmede", "Görüşüldü", "Makam İptal Etti", "Ziyaretçi Gelmedi", "Ertelendi"].map(status => (
                            <div key={status} className="flex items-center gap-3 text-sm text-slate-600">
                                <div className={cn("w-3 h-3 rounded-full",
                                    status === "Onaylandı" ? "bg-blue-500" :
                                        status === "Görüşüldü" ? "bg-emerald-500" :
                                            status === "Makam İptal Etti" ? "bg-red-500" :
                                                status === "Ertelendi" ? "bg-purple-500" :
                                                    status === "Ziyaretçi Gelmedi" ? "bg-slate-500" :
                                                        status === "Kapıda Bekliyor" ? "bg-orange-500" :
                                                            status === "Görüşmede" ? "bg-cyan-500" :
                                                                "bg-amber-500"
                                )}></div>
                                {status}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Calendar Area - Time Grid */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                {/* Header Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white sticky top-0 z-30">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => onViewModeChange("day")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                    viewMode === "day" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <CalendarDays className="w-4 h-4" />
                                Gün
                            </button>
                            <button
                                onClick={() => onViewModeChange("week")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                    viewMode === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <CalendarRange className="w-4 h-4" />
                                Hafta
                            </button>
                            <button
                                onClick={() => onViewModeChange("month")}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                    viewMode === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                <CalendarCheck className="w-4 h-4" />
                                Ay
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            <Button variant="ghost" size="sm" onClick={handlePrev} className="h-8 w-8 p-0">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDateChange(new Date())} className="h-8 px-3 text-xs font-medium">
                                Bugün
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleNext} className="h-8 w-8 p-0">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <h2 className="text-lg font-bold text-slate-800">
                            {getHeaderLabel()}
                        </h2>
                    </div>
                    <Button onClick={onAddClick} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Randevu Ekle
                    </Button>
                </div>

                {/* Content Area - Different layout based on view mode */}
                {viewMode === "day" ? (
                    /* Day View - Time Grid */
                    <div className="flex-1 overflow-y-auto relative bg-slate-50/30" ref={scrollRef}>
                        <div className="flex min-w-[600px] relative px-4 py-4" style={{ height: HOURS_COUNT * HOUR_HEIGHT + 40 }}>
                            {/* Time Column */}
                            <div className="w-16 flex-shrink-0 relative z-20">
                                {hours.map((hour) => (
                                    <div key={hour} className="text-xs font-medium text-slate-400 text-right pr-3 relative"
                                        style={{ height: HOUR_HEIGHT, top: -10 }}>
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            {/* Grid Area */}
                            <div className="flex-1 relative bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Horizontal Guidelines */}
                                {hours.map((hour) => (
                                    <div key={hour}
                                        className="border-b border-slate-100 absolute w-full pointer-events-none"
                                        style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                                    </div>
                                ))}

                                {/* Vertical Day Lines */}
                                <div className="absolute top-0 bottom-0 left-0 w-full border-l border-slate-50"></div>

                                {/* Current Time Indicator */}
                                {isToday && timeTop >= 0 && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-red-500 z-50 pointer-events-none flex items-center"
                                        style={{ top: timeTop }}
                                    >
                                        <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 border border-white shadow-sm ring-2 ring-red-100"></div>
                                    </div>
                                )}

                                {/* Appointments Layer */}
                                {positionedEvents.map((appointment) => {
                                    const style = getEventStyle(appointment);
                                    return (
                                        <div
                                            key={appointment.id}
                                            className={cn(
                                                "absolute rounded-md p-1.5 text-xs cursor-pointer transition-all hover:brightness-95 hover:shadow-md hover:z-40 border-opacity-50 overflow-hidden ring-1 ring-black/5 group/item",
                                                getStatusStyles(appointment.durum)
                                            )}
                                            style={style}
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="flex items-center gap-1 font-semibold min-w-0 flex-1">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                        appointment.durum === "Onaylandı" ? "bg-blue-600" :
                                                            appointment.durum === "Görüşüldü" ? "bg-emerald-600" :
                                                                "bg-amber-600"
                                                    )}></div>
                                                    <span className="truncate text-[10px]">{appointment.ad_soyad}</span>
                                                </div>
                                                {/* Action Buttons */}
                                                <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEditClick?.(appointment); }}
                                                        className="p-0.5 hover:bg-black/10 rounded transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteClick?.(appointment.id); }}
                                                        className="p-0.5 hover:bg-red-500/20 rounded transition-colors text-red-600"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="opacity-80 truncate text-[9px]">
                                                {appointment.saat}
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Interaction Layer for Adding */}
                                {hours.map((hour) => (
                                    <div
                                        key={`slot-${hour}`}
                                        className="absolute w-full z-0 group"
                                        style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                    >
                                        <div className="hidden group-hover:flex pl-2 pt-1 h-4 cursor-pointer hover:bg-black/[0.05] transition-colors rounded"
                                            onClick={onAddClick}>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Week/Month View - Grouped List by Date */
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {filteredAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <CalendarIcon className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-lg font-medium">Bu dönemde randevu bulunamadı</p>
                            </div>
                        ) : (
                            /* Group appointments by date */
                            Object.entries(
                                filteredAppointments.reduce((groups: Record<string, Randevu[]>, app) => {
                                    const dateKey = app.tarih || "unknown";
                                    if (!groups[dateKey]) groups[dateKey] = [];
                                    groups[dateKey].push(app);
                                    return groups;
                                }, {})
                            ).map(([dateKey, apps]) => (
                                <div key={dateKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    {/* Date Header */}
                                    <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">
                                                    {format(new Date(dateKey), "d", { locale: tr })}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {format(new Date(dateKey), "EEEE", { locale: tr })}
                                                </p>
                                                <p className="text-slate-300 text-sm">
                                                    {format(new Date(dateKey), "d MMMM yyyy", { locale: tr })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-white/20 text-white border-0">
                                            {apps.length} randevu
                                        </Badge>
                                    </div>

                                    {/* Appointments for this date */}
                                    <div className="divide-y divide-slate-100">
                                        {apps.map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
                                            >
                                                {/* Time */}
                                                <div className="w-16 flex-shrink-0">
                                                    <span className="font-mono font-bold text-slate-900">
                                                        {appointment.saat || "--:--"}
                                                    </span>
                                                </div>

                                                {/* Status Indicator */}
                                                <div className={cn(
                                                    "w-1 h-10 rounded-full flex-shrink-0",
                                                    appointment.durum === "Onaylandı" ? "bg-blue-500" :
                                                        appointment.durum === "Görüşüldü" ? "bg-emerald-500" :
                                                            appointment.durum === "Ertelendi" ? "bg-purple-500" :
                                                                "bg-amber-500"
                                                )}></div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-slate-900">
                                                            {appointment.ad_soyad || "İsimsiz"}
                                                        </p>
                                                        {(appointment.katilimci || 1) > 1 && (
                                                            <Badge variant="info" className="h-5 px-1.5 text-[10px] bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-200 gap-1 shadow-sm">
                                                                <Users className="w-3 h-3" />
                                                                {appointment.katilimci}
                                                            </Badge>
                                                        )}
                                                        {appointment.unvan && (
                                                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                                {appointment.unvan}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                            <span className="truncate font-medium">{appointment.kurum || "Kurum Yok"}</span>
                                                        </div>
                                                        {appointment.amac && (
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                                <span className="truncate italic text-slate-500">{appointment.amac}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <Badge className={cn(
                                                    "flex-shrink-0",
                                                    appointment.durum === "Onaylandı" ? "bg-blue-100 text-blue-700" :
                                                        appointment.durum === "Görüşüldü" ? "bg-emerald-100 text-emerald-700" :
                                                            appointment.durum === "Ertelendi" ? "bg-purple-100 text-purple-700" :
                                                                "bg-amber-100 text-amber-700"
                                                )}>
                                                    {appointment.durum || "Bekliyor"}
                                                </Badge>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => onEditClick?.(appointment)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteClick?.(appointment.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
