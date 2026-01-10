
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Tüm toplantıları listele
export async function GET() {
    try {
        const rezervasyonlar = await prisma.salon_rezervasyonlari.findMany({
            include: { dokumanlar: true }
        });

        // Frontend (Calendar) için formatlama
        const formattedEvents = rezervasyonlar.map(rez => {
            if (!rez.tarih || !rez.bas_saat || !rez.bit_saat) return null;

            // Timezone Düzeltmesi: Veritabanından gelen Date objesi UTC olabilir.
            // Bunu yerel tarihe göre string'e çeviriyoruz.
            const d = new Date(rez.tarih);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // ISO string oluştururken T kullanıyoruz
            const start = new Date(`${dateStr}T${rez.bas_saat}:00`);
            const end = new Date(`${dateStr}T${rez.bit_saat}:00`);

            return {
                id: rez.id,
                title: rez.baslik,
                resourceId: rez.salon_id,
                start,
                end,
                organizer: rez.rez_sahibi,
                isProtocol: rez.kararlar?.includes("PROTOKOL") || rez.baslik?.toUpperCase().includes("VALİ") || false,
                desc: rez.kararlar || "",
                type: rez.tur,
                format: rez.toplanti_format,
                equipment: rez.ekipmanlar,
                participants: rez.katilimci_listesi,
                catering: rez.ikram_talebi,
                press: rez.fotograf_basin,
                agenda: rez.gundem_maddeleri,
                status: rez.durum || "Onay Bekliyor",
                documents: rez.dokumanlar
            };
        }).filter(Boolean);

        return NextResponse.json({ success: true, data: formattedEvents });

    } catch (error) {
        console.error("Toplantılar alınamadı:", error);
        return NextResponse.json({ success: false, error: "Veri hatası." }, { status: 500 });
    }
}

// POST: Yeni Rezervasyon Ekle
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            title, resourceId, start, end, organizer, isProtocol, recurrence, repeatCount, type,
            description, format, equipment, participants, catering, press, agenda,
            status, statusReason, postponedDate, approvedBy
        } = body;

        let currentStart = new Date(start);
        let currentEnd = new Date(end);

        const count = (recurrence && recurrence !== 'none') ? (Number(repeatCount) || 1) : 1;
        const salon = await prisma.toplanti_salonlari.findUnique({ where: { id: Number(resourceId) } });
        const createdEvents = [];

        // Determine 'kararlar' (Notes/Protocol)
        const kararlarText = isProtocol
            ? (description ? `PROTOKOL - ${description}` : "PROTOKOL")
            : (description || "");

        for (let i = 0; i < count; i++) {
            const tarih = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate(), 12, 0, 0);
            const bas_saat = currentStart.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const bit_saat = currentEnd.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            const newRez = await prisma.salon_rezervasyonlari.create({
                data: {
                    baslik: title,
                    salon_id: Number(resourceId),
                    salon_ad: salon?.ad || "",
                    rez_sahibi: organizer,
                    tarih: tarih,
                    bas_saat: bas_saat,
                    bit_saat: bit_saat,
                    kararlar: kararlarText,
                    tur: type,
                    toplanti_format: format,
                    ekipmanlar: equipment,
                    katilimci_listesi: participants,
                    ikram_talebi: catering,
                    fotograf_basin: press,
                    gundem_maddeleri: agenda,
                    durum: status || "Onay Bekliyor",
                    durum_aciklamasi: statusReason,
                    ertelenen_tarih: postponedDate ? new Date(postponedDate) : null,
                    onaylayan: approvedBy
                }
            });
            createdEvents.push(newRez);

            // Sonraki tarih hesaplama
            if (recurrence === 'daily') {
                currentStart.setDate(currentStart.getDate() + 1);
                currentEnd.setDate(currentEnd.getDate() + 1);
            } else if (recurrence === 'weekly') {
                currentStart.setDate(currentStart.getDate() + 7);
                currentEnd.setDate(currentEnd.getDate() + 7);
            } else if (recurrence === 'monthly') {
                currentStart.setMonth(currentStart.getMonth() + 1);
                currentEnd.setMonth(currentEnd.getMonth() + 1);
            } else if (recurrence === 'yearly') {
                currentStart.setFullYear(currentStart.getFullYear() + 1);
                currentEnd.setFullYear(currentEnd.getFullYear() + 1);
            }
        }

        return NextResponse.json({ success: true, created: createdEvents.length, data: createdEvents[0] });

    } catch (error: any) {
        console.error("Kayıt hatası:", error);
        return NextResponse.json({ success: false, error: "Kayıt oluşturulamadı: " + (error.message || String(error)) }, { status: 500 });
    }
}
