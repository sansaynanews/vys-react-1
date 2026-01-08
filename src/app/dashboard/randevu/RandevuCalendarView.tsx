"use client";

import { useState } from "react";
import { format, addDays, isSameDay, parseISO, setHours, setMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/Calendar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, MapPin, Plus, User, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

// Mock Data Types
type AppointmentType = "resmi" | "ozel" | "acil" | "rutin";

interface Appointment {
    id: string;
    title: string;
    time: string; // "09:00"
    duration: number; // minutes
    type: AppointmentType;
    attendees: string[];
    location?: string;
    description?: string;
    date: Date;
}

// Mock Data Generator
const generateMockAppointments = (): Appointment[] => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    return [
        {
            id: "1",
            title: "İl Emniyet Müdürü Görüşmesi",
            time: "09:00",
            duration: 60,
            type: "acil",
            attendees: ["Ahmet Yılmaz", "Mehmet Demir"],
            location: "Makam Odası",
            description: "Asayiş raporlarının değerlendirilmesi",
            date: today,
        },
        {
            id: "2",
            title: "Haftalık Koordinasyon Toplantısı",
            time: "11:00",
            duration: 120,
            type: "resmi",
            attendees: ["Tüm Birim Amirleri"],
            location: "Toplantı Salonu A",
            date: today,
        },
        {
            id: "3",
            title: "Öğle Arası",
            time: "13:00",
            duration: 60,
            type: "rutin",
            attendees: [],
            date: today,
        },
        {
            id: "4",
            title: "Vatandaş Kabul Günü",
            time: "14:30",
            duration: 180,
            type: "resmi",
            attendees: ["Halkla İlişkiler"],
            location: "Kabul Salonu",
            date: today,
        },
        {
            id: "5",
            title: "Bakanlık Heyeti Karşılama",
            time: "10:00",
            duration: 90,
            type: "resmi",
            attendees: ["Vali Yrd.", "Protokol Müdürü"],
            location: "Havalimanı VIP",
            date: tomorrow,
        },
        {
            id: "6",
            title: "Özel Kalem İşlemleri",
            time: "14:00",
            duration: 60,
            type: "ozel",
            attendees: ["Özel Kalem Müdürü"],
            date: tomorrow,
        },
        {
            id: "7",
            title: "Saha İncelemesi",
            time: "09:30",
            duration: 240,
            type: "resmi",
            attendees: ["Fen İşleri", "Yüklenici Firma"],
            location: "Yeni Hastane İnşaatı",
            date: nextWeek,
        },
    ];
};

const mockAppointments = generateMockAppointments();

// Style Helpers
const getTypeStyles = (type: AppointmentType) => {
    switch (type) {
        case "resmi":
            return "border-l-4 border-blue-500 bg-blue-50/50 text-blue-900";
        case "acil":
            return "border-l-4 border-rose-500 bg-rose-50/50 text-rose-900";
        case "ozel":
            return "border-l-4 border-amber-500 bg-amber-50/50 text-amber-900";
        case "rutin":
            return "border-l-4 border-slate-300 bg-slate-50/50 text-slate-700";
        default:
            return "border-l-4 border-slate-200 bg-gray-50 text-gray-700";
    }
};

const getTypeLabel = (type: AppointmentType) => {
    switch (type) {
        case "resmi": return "Resmi";
        case "acil": return "Acil";
        case "ozel": return "Özel";
        case "rutin": return "Rutin";
        default: return "";
    }
}

const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 09:00 - 18:00

export default function RandevuCalendarView() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Filter appointments for selected date
    const todaysAppointments = mockAppointments.filter((app) =>
        isSameDay(app.date, selectedDate || new Date())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
            {/* Left Sidebar: Date Picker & Mini Stats */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 h-fit">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md w-full flex justify-center"
                    />
                </div>

                {/* Quick Stats or Legends */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Randevu Türleri</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            Resmi Randevular
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            Acil / Kritik
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            Özel / Şahsi
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            Rutin / Diğer
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Content: Daily Agenda */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : "Tarih Seçiniz"}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {selectedDate ? format(selectedDate, "EEEE", { locale: tr }) : ""} Günü Programı
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                            Bugün
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Randevu
                        </Button>
                    </div>
                </div>

                {/* Agenda Timeline */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    {hours.map((hour) => {
                        const hourString = `${hour.toString().padStart(2, '0')}:00`;
                        const appointment = todaysAppointments.find(a => a.time.startsWith(hour.toString().padStart(2, '0'))); // Simple matching for visual demo

                        return (
                            <div key={hour} className="group flex gap-4 min-h-[100px]">
                                {/* Time Column */}
                                <div className="w-16 flex-shrink-0 text-slate-400 font-medium text-sm pt-2 text-right">
                                    {hourString}
                                </div>

                                {/* Event Column */}
                                <div className="flex-1 border-t border-slate-100 relative group-hover:bg-slate-50/50 rounded-lg transition-colors p-2 -mt-2">
                                    {appointment ? (
                                        <div className={cn(
                                            "h-full w-full rounded-lg p-4 shadow-sm transition-all hover:shadow-md cursor-pointer flex flex-col justify-between border border-transparent hover:border-slate-200",
                                            getTypeStyles(appointment.type)
                                        )}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                                                        {appointment.title}
                                                        <Badge variant="outline" className="bg-white/50 border-0 text-xs font-normal">
                                                            {getTypeLabel(appointment.type)}
                                                        </Badge>
                                                    </h4>

                                                    <div className="flex items-center gap-4 text-sm opacity-90 mt-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {appointment.time} - {parseInt(appointment.time.split(':')[0]) + Math.floor(appointment.duration / 60)}:{appointment.time.split(':')[1]}
                                                        </div>
                                                        {appointment.location && (
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {appointment.location}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-current hover:bg-black/5">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {appointment.attendees.length > 0 && (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        {appointment.attendees.slice(0, 3).map((person, i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-600 font-bold" title={person}>
                                                                {person.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {appointment.attendees.length > 3 && (
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] text-slate-500 font-bold">
                                                                +{appointment.attendees.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs opacity-75">{appointment.attendees.join(", ")}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Empty Slot State */
                                        <div className="h-full w-full flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-dashed border-blue-200 bg-blue-50/30 w-full justify-start h-12">
                                                <Plus className="w-4 h-4 mr-2" />
                                                {format(setHours(new Date(), hour), "HH:00")} için Randevu Oluştur
                                            </Button>
                                            <div className="flex-1 border-b border-dashed border-slate-200 ml-4"></div>
                                            <span className="text-xs text-slate-400 bg-white px-2 ml-2">Müsait</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
