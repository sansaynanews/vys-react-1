"use client";
import React from 'react';
import {
    CalendarCheck,
    CalendarClock,
    History,
    PauseCircle,
    ArrowRightCircle,
    XCircle,
    UserX,
    CheckCircle2,
    List
} from "lucide-react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@/components/ui/Popover";
import { APPOINTMENT_STATUS, getStatusConfig } from "@/lib/constants";

interface StatsGridProps {
    randevular: any[];
}

export default function StatsGrid({ randevular }: StatsGridProps) {
    if (!randevular) return null;

    const statDefinitions = [
        {
            key: 'approved',
            label: 'Onaylı Randevu',
            statuses: [APPOINTMENT_STATUS.APPROVED.id, APPOINTMENT_STATUS.APPROVED_WAITING_DATE.id],
            gradient: 'from-blue-600 to-indigo-600',
            border: 'border-blue-200',
            bg: 'bg-blue-50',
            text: 'text-blue-900',
            icon: CalendarCheck
        },
        {
            key: 'pending',
            label: 'Onay Bekleyen',
            statuses: [APPOINTMENT_STATUS.PENDING_APPROVAL.id],
            gradient: 'from-orange-500 to-amber-500',
            border: 'border-orange-200',
            bg: 'bg-orange-50',
            text: 'text-orange-900',
            icon: CalendarClock
        },
        {
            key: 'reschedule_req',
            label: 'Ziyaretçi Erteleme',
            statuses: [APPOINTMENT_STATUS.RESCHEDULE_REQ_VISITOR.id],
            gradient: 'from-amber-500 to-yellow-500',
            border: 'border-amber-200',
            bg: 'bg-amber-50',
            text: 'text-amber-900',
            icon: History
        },
        {
            key: 'pool',
            label: 'Havuzda / Beklemede',
            statuses: [APPOINTMENT_STATUS.ON_HOLD.id],
            gradient: 'from-slate-500 to-gray-600',
            border: 'border-slate-200',
            bg: 'bg-slate-50',
            text: 'text-slate-900',
            icon: PauseCircle
        },
        {
            key: 'delegated',
            label: 'Yönlendirilen',
            statuses: [APPOINTMENT_STATUS.DELEGATED_SUB.id, APPOINTMENT_STATUS.DELEGATED_UNIT.id],
            gradient: 'from-purple-500 to-violet-600',
            border: 'border-purple-200',
            bg: 'bg-purple-50',
            text: 'text-purple-900',
            icon: ArrowRightCircle
        },
        {
            key: 'rescheduled_host',
            label: 'Ertelendi (Makam)',
            statuses: [APPOINTMENT_STATUS.RESCHEDULED_HOST.id],
            gradient: 'from-cyan-500 to-blue-500',
            border: 'border-cyan-200',
            bg: 'bg-cyan-50',
            text: 'text-cyan-900',
            icon: CalendarClock
        },
        {
            key: 'rejected',
            label: 'Reddedilen',
            statuses: [APPOINTMENT_STATUS.REJECTED.id],
            gradient: 'from-red-500 to-rose-600',
            border: 'border-red-200',
            bg: 'bg-red-50',
            text: 'text-red-900',
            icon: XCircle
        },
        {
            key: 'no_show',
            label: 'Ziyaretçi Gelmedi',
            statuses: [APPOINTMENT_STATUS.NO_SHOW.id],
            gradient: 'from-rose-500 to-pink-600',
            border: 'border-rose-200',
            bg: 'bg-rose-50',
            text: 'text-rose-900',
            icon: UserX
        },
        {
            key: 'completed',
            label: 'Tamamlanan',
            statuses: [APPOINTMENT_STATUS.COMPLETED.id],
            gradient: 'from-emerald-500 to-teal-600',
            border: 'border-emerald-200',
            bg: 'bg-emerald-50',
            text: 'text-emerald-900',
            icon: CheckCircle2
        }
    ];

    const dynamicStats = statDefinitions.map(def => {
        const list = randevular.filter(r => (def.statuses as string[]).includes(getStatusConfig(r.durum).id as any));
        return { ...def, list, count: list.length };
    }).filter(s => s.count > 0);

    const totalStat = {
        key: 'total',
        label: 'Toplam Randevu',
        count: randevular.length,
        list: randevular,
        statuses: [],
        gradient: 'from-orange-500 to-amber-600',
        border: 'border-orange-300',
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        icon: List
    };

    const finalStats = [totalStat, ...dynamicStats];

    return (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {finalStats.map(stat => (
                <Popover key={stat.key}>
                    <PopoverTrigger asChild>
                        <div className={`group relative overflow-hidden rounded-2xl p-4 border ${stat.border}/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-${stat.border.split('-')[1]}-400/60 hover:shadow-lg cursor-pointer`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 via-transparent to-transparent group-hover:opacity-10 transition-opacity duration-500`}></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-orange-200/80 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                    <span className="text-3xl font-black text-white">{stat.count}</span>
                                </div>
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/10`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                                <div className={`h-full bg-gradient-to-r ${stat.gradient} w-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className={`w-80 p-0 ${stat.border} shadow-2xl`} align="start">
                        <div className="bg-white rounded-md overflow-hidden">
                            <div className={`${stat.bg} px-3 py-2 border-b ${stat.border.replace('200', '100')} flex justify-between items-center`}>
                                <h4 className={`text-xs font-bold ${stat.text} uppercase`}>{stat.label}</h4>
                                <span className={`text-[10px] bg-white border ${stat.border} ${stat.text} px-1.5 py-0.5 rounded-full`}>{stat.count}</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto p-1 space-y-1">
                                {stat.list.map(r => (
                                    <div key={r.id} className={`p-2 hover:${stat.bg}/50 rounded border border-transparent hover:${stat.border} transition-colors`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-sm text-slate-800 line-clamp-1">{r.ad_soyad}</span>
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${stat.bg} ${stat.text}`}>
                                                {stat.key === 'completed' ? (r.cikis_saati || "-") : (r.saat || "-")}
                                            </span>
                                        </div>
                                        {stat.key === 'completed' && r.sonuc_notlari ? (
                                            <div className={`text-[10px] ${stat.text}/80 mt-1 line-clamp-1`}>Not: {r.sonuc_notlari}</div>
                                        ) : r.amac ? (
                                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{r.amac}</div>
                                        ) : null}
                                        <div className={`text-[10px] ${stat.text} mt-0.5`}>{getStatusConfig(r.durum).label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            ))}
        </div>
    );
}
