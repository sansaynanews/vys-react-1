
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Salonları Listele
export async function GET() {
    try {
        const salonlar = await prisma.toplanti_salonlari.findMany();
        return NextResponse.json({ success: true, data: salonlar });
    } catch (error) {
        console.error("Salonlar alınamadı:", error);
        return NextResponse.json({ success: false, error: "Salonlar alınırken hata oluştu." }, { status: 500 });
    }
}

// POST: Yeni Salon Ekle
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { ad, kapasite, konum, ekipman, notlar } = body;

        const newSalon = await prisma.toplanti_salonlari.create({
            data: {
                ad,
                kapasite: Number(kapasite),
                konum,
                ekipman,
                notlar: notlar || ""
            }
        });

        return NextResponse.json({ success: true, data: newSalon });
    } catch (error) {
        console.error("Salon ekleme hatası:", error);
        return NextResponse.json({ success: false, error: "Salon eklenemedi." }, { status: 500 });
    }
}
