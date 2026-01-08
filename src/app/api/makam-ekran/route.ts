import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const today = dayjs().startOf('day').toDate();
        const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();

        // Fetch all appointments for today
        const appointments = await prisma.makam_randevu.findMany({
            where: {
                tarih: {
                    gte: today,
                    lt: tomorrow
                }
            },
            orderBy: { saat: 'asc' }
        });

        // Determine Status
        // Logic: 
        // - "Inside": Status is 'Makamda' (if we had that status explicitly) or strictly based on time?
        // - Legacy code seems to use `next_appointment` API.
        // - Let's look for the appointment that is closest to now but not completed.

        // Actually, let's categorize them.
        // We assume 'durum' field exists or we infer from time? 
        // Checking schema: `durum` field exists in `makam_randevu`.
        // Valid values might be: 'Bekliyor', 'Onaylandı', 'Tamamlandı'? 
        // Let's assume 'Tamamlandı' means completed.

        // We need to match the legacy display logic:
        // "Current" (Sıradaki Kabul) -> The active or next confirmed appointment.
        // "Completed" (Tamamlanan) -> Past/Done.
        // "Upcoming" (Günün Kalanı) -> Future.

        const now = dayjs();
        const nowTimeStr = now.format("HH:mm");

        let current = null;
        let upcoming = [];
        let completed = [];

        // Simple logic:
        // If status is 'Görüşülüyor' (or similar) -> Current.
        // Else -> time based.

        // For this implementation, let's assume:
        // Completed: durum = 'Tamamlandı' or (time passed + not 'Bekliyor')?
        // Actually, let's iterate.

        for (const appt of appointments) {
            // Format time for comparison if needed, or just use `durum`.
            if (appt.durum === 'Tamamlandı' || appt.durum === 'İptal') {
                completed.push(appt);
            } else {
                // It's active or pending.
                if (!current) {
                    current = appt; // First non-completed is "Current/Next"
                } else {
                    upcoming.push(appt); // Rest are upcoming
                }
            }
        }

        // Format for frontend
        const formatAppt = (item: any) => ({
            id: item.id,
            saat: item.saat ? dayjs(item.saat).format("HH:mm") : "--:--",
            ad_soyad: item.ad_soyad,
            kurum: item.kurum,
            konu: item.konu // Used for 'heyet' or notes if needed
        });

        return NextResponse.json({
            current: current ? formatAppt(current) : null,
            upcoming: upcoming.map(formatAppt),
            completed: completed.map(formatAppt),
            time: nowTimeStr,
            date: now.format("DD MMMM YYYY, dddd") // Turkish locale handling needed in frontend mainly, but sending string helps
        });

    } catch (error) {
        console.error("Screen API Error:", error);
        return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
    }
}
