import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { APPOINTMENT_STATUS, getStatusConfig } from "@/lib/constants";

interface DailyProtocolPrintProps {
    date: Date;
    appointments: any[];
}

export default function DailyProtocolPrint({ date, appointments }: DailyProtocolPrintProps) {
    // Sadece onaylı ve tamamlanmış randevuları filtrele
    const validAppointments = appointments
        .filter(app => {
            const statusId = getStatusConfig(app.durum).id;
            return [
                APPOINTMENT_STATUS.APPROVED.id,
                APPOINTMENT_STATUS.COMPLETED.id,
                APPOINTMENT_STATUS.IN_MEETING.id,
                APPOINTMENT_STATUS.WAITING_ROOM.id
            ].includes(statusId as any);
        })
        .sort((a, b) => (a.saat || "").localeCompare(b.saat || ""));

    return (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 overflow-y-auto w-full h-full left-0 top-0">
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold font-serif text-black tracking-wide">T.C.</h1>
                <h1 className="text-2xl font-bold font-serif text-black mb-2">[İL ADI] VALİLİĞİ</h1>
                <h2 className="text-xl font-semibold text-black mt-4">GÜNLÜK KABUL PROGRAMI</h2>
                <p className="text-lg text-black mt-2 font-medium">
                    {format(date, "d MMMM yyyy, EEEE", { locale: tr })}
                </p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-left w-24 font-bold text-black text-sm">SAAT</th>
                        <th className="border border-black p-2 text-left font-bold text-black text-sm">MİSAFİR / KURUM</th>
                        <th className="border border-black p-2 text-left font-bold text-black text-sm">KONU</th>
                        <th className="border border-black p-2 text-left w-32 font-bold text-black text-sm">NOTLAR</th>
                    </tr>
                </thead>
                <tbody>
                    {validAppointments.length > 0 ? (
                        validAppointments.map((app, index) => (
                            <tr key={index} className="break-inside-avoid">
                                <td className="border border-black p-3 text-sm font-bold text-black align-top">
                                    {app.saat}
                                </td>
                                <td className="border border-black p-3 text-sm text-black align-top">
                                    <div className="font-bold">{app.ad_soyad}</div>
                                    {app.unvan && <div className="text-xs italic">{app.unvan}</div>}
                                    <div className="text-xs">{app.kurum}</div>
                                    {app.iletisim && <div className="text-xs mt-1 text-gray-600 print:text-black">İletişim: {app.iletisim}</div>}
                                </td>
                                <td className="border border-black p-3 text-sm text-black align-top">
                                    {app.amac || "-"}
                                </td>
                                <td className="border border-black p-3 text-sm text-black align-top">
                                    {/* Özel notlar veya boş alan not almak için */}
                                    {app.notlar ? <span className="text-xs">{app.notlar}</span> : ""}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="border border-black p-8 text-center italic text-black">
                                Bugün için planlanmış görüşme bulunmamaktadır.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-12 flex justify-end">
                <div className="text-center">
                    <p className="text-black font-medium mb-16">ARZ EDERİM</p>
                    <p className="text-black font-bold">Özel Kalem Müdürü</p>
                </div>
            </div>
        </div>
    );
}
