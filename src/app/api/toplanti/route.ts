
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Tüm toplantıları listele
export async function GET() {
    try {
        const rezervasyonlar = await prisma.salon_rezervasyonlari.findMany();

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
                start, // frontend Date objesi bekliyor
                end,
                organizer: rez.rez_sahibi,
                isProtocol: rez.kararlar === "PROTOKOL" || rez.baslik?.toUpperCase().includes("VALİ") || false,
                desc: rez.kararlar || ""
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
        const { title, resourceId, start, end, organizer, isProtocol } = body;

        const startDate = new Date(start);
        const endDate = new Date(end);

        // Tarih alanına sadece gün bilgisini doğru kaydetmek için
        // UTC offset sorununu aşmak adına, saati öğlen 12'ye sabitleyip kaydedebiliriz
        // Veya string olarak Parse edebiliriz.
        // Prisma `Date` tipi için Date objesi bekler.

        const tarih = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0); // Öğlen 12 yaptık ki timezone kaymasın.

        const bas_saat = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const bit_saat = endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const salon = await prisma.toplanti_salonlari.findUnique({ where: { id: Number(resourceId) } });

        const newRez = await prisma.salon_rezervasyonlari.create({
            data: {
                baslik: title,
                salon_id: Number(resourceId),
                salon_ad: salon?.ad || "",
                rez_sahibi: organizer,
                tarih: tarih,
                bas_saat: bas_saat,
                bit_saat: bit_saat,
                kararlar: isProtocol ? "PROTOKOL" : ""
            }
        });

        return NextResponse.json({ success: true, data: newRez });

    } catch (error) {
        console.error("Kayıt hatası:", error);
        return NextResponse.json({ success: false, error: "Kayıt oluşturulamadı." }, { status: 500 });
    }
}
