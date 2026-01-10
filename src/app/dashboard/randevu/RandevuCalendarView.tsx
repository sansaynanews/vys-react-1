"use client";

import { useEffect, useState, useRef } from "react";
import { format, isSameDay, setHours, addDays, subDays, getHours, getMinutes, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/Calendar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays, CalendarRange, CalendarCheck, Edit2, Trash2, Building2, Users, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getStatusConfig, APPOINTMENT_STATUS } from "@/lib/constants";

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
    onEditClick?: (randevu: Randevu) => void;
    onDeleteClick?: (id: number) => void;
    onAddClick?: (date?: Date, time?: string) => void;
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
            <style jsx global>{`
                @media print {
                    @page { size: landscape; margin: 5mm; }
                    body * { visibility: hidden; }
                    .randevu-print-area, .randevu-print-area * { visibility: visible; }
                    .randevu-print-area { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

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

                {/* Daily Summary & Upcoming */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
                    {/* Mini Stats */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Günlük Özet</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                                <p className="text-2xl font-bold text-blue-700">
                                    {appointments.filter(a => {
                                        const statusId = getStatusConfig(a.durum).id;
                                        return statusId === APPOINTMENT_STATUS.APPROVED.id;
                                    }).length}
                                </p>
                                <p className="text-[10px] font-medium text-blue-600 uppercase">Onaylı</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                                <p className="text-2xl font-bold text-amber-700">
                                    {appointments.filter(a => {
                                        const statusId = getStatusConfig(a.durum).id;
                                        return statusId === APPOINTMENT_STATUS.WAITING_ROOM.id;
                                    }).length}
                                </p>
                                <p className="text-[10px] font-medium text-amber-600 uppercase">Beklemede</p>
                            </div>
                            <div className="bg-cyan-50 rounded-lg p-3 text-center border border-cyan-100">
                                <p className="text-2xl font-bold text-cyan-700">
                                    {appointments.filter(a => {
                                        const statusId = getStatusConfig(a.durum).id;
                                        return statusId === APPOINTMENT_STATUS.IN_MEETING.id;
                                    }).length}
                                </p>
                                <p className="text-[10px] font-medium text-cyan-600 uppercase">Görüşmede</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                                <p className="text-2xl font-bold text-emerald-700">
                                    {appointments.filter(a => {
                                        const statusId = getStatusConfig(a.durum).id;
                                        return statusId === APPOINTMENT_STATUS.COMPLETED.id;
                                    }).length}
                                </p>
                                <p className="text-[10px] font-medium text-emerald-600 uppercase">Tamamlandı</p>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sıradaki Görüşmeler</h3>
                        <div className="space-y-2">
                            {(() => {
                                const now = new Date();
                                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                const upcoming = appointments
                                    .filter(a => {
                                        const statusId = getStatusConfig(a.durum).id;
                                        return (statusId === APPOINTMENT_STATUS.APPROVED.id ||
                                            statusId === APPOINTMENT_STATUS.WAITING_ROOM.id) &&
                                            a.saat && a.saat >= currentTime;
                                    })
                                    .sort((a, b) => (a.saat || "").localeCompare(b.saat || ""))
                                    .slice(0, 3);

                                if (upcoming.length === 0) {
                                    return (
                                        <div className="text-center py-4 text-sm text-slate-400 italic">
                                            Bugün için bekleyen randevu yok
                                        </div>
                                    );
                                }

                                return upcoming.map((app, idx) => (
                                    <div
                                        key={app.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
                                            idx === 0
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-slate-50 border-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center",
                                            idx === 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
                                        )}>
                                            <span className="font-bold text-sm">{app.saat}</span>
                                            <span className="text-[9px] opacity-80">
                                                {app.tarih ? format(new Date(app.tarih), "dd MMM", { locale: tr }) : "-"}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{app.ad_soyad}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{app.kurum}</p>
                                        </div>
                                        {idx === 0 && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 rounded-full">
                                                Sıradaki
                                            </span>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Calendar Area - Time Grid */}
            <div className="randevu-print-area flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
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
                    <Button onClick={() => onAddClick?.()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Randevu Ekle
                    </Button>
                </div>

                {/* Content Area - Grid System for Day & Week */}
                {(viewMode === "day" || viewMode === "week") ? (
                    <div className="flex-1 overflow-auto relative bg-slate-50/30 overscroll-contain" ref={scrollRef}>
                        <div className="flex min-w-[800px] relative px-4 py-4" style={{ height: HOURS_COUNT * HOUR_HEIGHT + 60 }}>

                            {/* Time Axis (Left) */}
                            <div className="w-14 flex-shrink-0 relative z-20 pt-8 border-r border-slate-100 bg-white/50 backdrop-blur-sm sticky left-0">
                                {hours.map((hour) => (
                                    <div key={hour} className="text-xs font-medium text-slate-400 text-right pr-2 relative"
                                        style={{ height: HOUR_HEIGHT, top: -10 }}>
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            {/* Main Grid Area */}
                            <div className="flex-1 flex flex-col relative min-w-0">

                                {/* Header (Days) */}
                                <div className="flex border-b border-slate-200 sticky top-0 bg-white z-30 shadow-sm h-8">
                                    {viewMode === "day" ? (
                                        <div className="flex-1 px-2 flex items-center justify-center font-semibold text-slate-700 text-sm">
                                            {format(date, "d MMMM EEEE", { locale: tr })}
                                        </div>
                                    ) : (
                                        // Week View Columns
                                        Array.from({ length: 7 }).map((_, i) => {
                                            const dayDate = addDays(startOfWeek(date, { weekStartsOn: 1 }), i);
                                            const isTodayHeader = isSameDay(dayDate, new Date());
                                            return (
                                                <div key={i} className={cn(
                                                    "flex-1 flex items-center justify-center gap-1 text-sm border-r border-slate-100 last:border-0",
                                                    isTodayHeader ? "bg-blue-50/50 text-blue-700 font-bold" : "text-slate-600 font-medium"
                                                )}>
                                                    <span className="opacity-70">{format(dayDate, "EEE", { locale: tr })}</span>
                                                    <span>{format(dayDate, "d", { locale: tr })}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Body (Columns & Rows) */}
                                <div className="flex-1 flex relative">
                                    {/* Horizontal Time Lines (Background) */}
                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                        {hours.map((hour) => (
                                            <div key={hour}
                                                className="border-b border-slate-100 w-full"
                                                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Day Columns */}
                                    {(viewMode === "day" ? [date] : Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(date, { weekStartsOn: 1 }), i))).map((dayDate, dayIndex) => {
                                        // Calculate events for this specific day
                                        const dayStr = format(dayDate, "yyyy-MM-dd");
                                        const dayEvents = appointments.filter(a => a.tarih === dayStr);

                                        // Position logic specific to this day's events
                                        // Copied logic from getEventsWithPositions but simplified/inline or wrapped
                                        const getDayPositions = (events: Randevu[]) => {
                                            const sorted = [...events].sort((a, b) => (a.saat || "").localeCompare(b.saat || ""));
                                            type PositionedEvent = Randevu & { column: number; totalColumns: number };
                                            const positioned: PositionedEvent[] = [];
                                            const parseTime = (t: string | null) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

                                            for (const event of sorted) {
                                                const start = parseTime(event.saat);
                                                const end = start + 45;
                                                const overlapping = positioned.filter(p => {
                                                    const pStart = parseTime(p.saat); const pEnd = pStart + 45;
                                                    return start < pEnd && end > pStart;
                                                });
                                                const taken = new Set(overlapping.map(p => p.column));
                                                let col = 0; while (taken.has(col)) col++;
                                                positioned.push({ ...event, column: col, totalColumns: 1 });
                                            }
                                            // Expand totalColumns
                                            for (const event of positioned) {
                                                const start = parseTime(event.saat); const end = start + 45;
                                                const overlapping = positioned.filter(p => {
                                                    const pStart = parseTime(p.saat); const pEnd = pStart + 45;
                                                    return start < pEnd && end > pStart;
                                                });
                                                const maxCol = Math.max(...overlapping.map(p => p.column)) + 1;
                                                overlapping.forEach(p => p.totalColumns = maxCol);
                                            }
                                            return positioned;
                                        };

                                        const positionedEvents = getDayPositions(dayEvents);
                                        const isDayToday = isSameDay(dayDate, new Date());

                                        return (
                                            <div key={dayIndex} className="flex-1 relative border-r border-slate-100 last:border-0 z-10">

                                                {/* Current Time Indicator Line (Only if Today) */}
                                                {isDayToday && timeTop >= 0 && (
                                                    <div className="absolute w-full border-t-2 border-red-500 z-50 pointer-events-none" style={{ top: timeTop }}>
                                                        <div className="w-2 h-2 bg-red-500 rounded-full -mt-1 -ml-1"></div>
                                                    </div>
                                                )}

                                                {/* Events */}
                                                {positionedEvents.map(app => {
                                                    const style = getEventStyle(app);
                                                    return (
                                                        <div
                                                            key={app.id}
                                                            className={cn(
                                                                "absolute rounded-md p-1 border-l-2 text-[10px] cursor-pointer transition-all hover:brightness-95 hover:z-50 hover:shadow-lg overflow-hidden group/item",
                                                                getStatusStyles(app.durum)
                                                            )}
                                                            style={{
                                                                ...style,
                                                                left: `calc(${style.left} + 1px)`,
                                                                width: `calc(${style.width} - 2px)`
                                                            }}
                                                            // Simple Click to Edit
                                                            onClick={(e) => { e.stopPropagation(); onEditClick?.(app); }}
                                                        >
                                                            <div className="font-bold truncate leading-tight">{app.saat}</div>
                                                            <div className="font-semibold truncate leading-tight">{app.ad_soyad}</div>
                                                            <div className="truncate opacity-75">{app.kurum}</div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Click-to-add slots overlay */}
                                                {hours.map((hour) => (
                                                    <div
                                                        key={`slot-${hour}`}
                                                        className="absolute w-full hover:bg-black/5 transition-colors cursor-pointer z-0"
                                                        style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                                        onClick={() => {
                                                            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                                            onAddClick?.(dayDate, timeStr);
                                                        }}
                                                        title={`${format(dayDate, "d MMM")} ${hour}:00 Randevu Ekle`}
                                                    >
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Month View (Still List for now, can be upgraded later) */
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {filteredAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <CalendarIcon className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-lg font-medium">Bu dönemde randevu bulunamadı</p>
                            </div>
                        ) : (
                            /* Existing List Render Logic */
                            Object.entries(
                                filteredAppointments.reduce((groups: Record<string, Randevu[]>, app) => {
                                    const dateKey = app.tarih || "unknown";
                                    if (!groups[dateKey]) groups[dateKey] = [];
                                    groups[dateKey].push(app);
                                    return groups;
                                }, {})
                            ).map(([dateKey, apps]) => (
                                <div key={dateKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                        <span className="font-bold text-slate-700">{format(new Date(dateKey), "d MMMM EEEE", { locale: tr })}</span>
                                        <Badge variant="info">{apps.length}</Badge>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {apps.map(app => (
                                            <div key={app.id} className="p-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer" onClick={() => onEditClick?.(app)}>
                                                <div className="w-12 font-mono font-bold text-slate-500 text-sm">{app.saat}</div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-800">{app.ad_soyad}</div>
                                                    <div className="text-xs text-slate-500">{app.kurum}</div>
                                                </div>
                                                <Badge className={getStatusConfig(app.durum).color}>{getStatusConfig(app.durum).label}</Badge>
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
