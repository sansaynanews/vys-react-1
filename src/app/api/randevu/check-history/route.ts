import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ad_soyad = searchParams.get("ad_soyad");

        if (!ad_soyad || ad_soyad.length < 3) {
            return NextResponse.json({ history: [] });
        }

        // Geçmişte hediye verilmiş randevuları bul
        // contains yerine tam eşleşme veya fuzzy search daha iyi olabilir ama şimdilik contains yeterli
        const history = await prisma.randevular.findMany({
            where: {
                ad_soyad: {
                    contains: ad_soyad
                },
                hediye_notu: {
                    not: null
                }
            },
            select: {
                id: true,
                tarih: true,
                hediye_notu: true,
                unvan: true,
                kurum: true
            },
            orderBy: {
                tarih: 'desc'
            },
            take: 5
        });

        // Boş string olan notları filtrele
        const validHistory = history.filter(h => h.hediye_notu && h.hediye_notu.trim().length > 0);

        return NextResponse.json({ history: validHistory });
    } catch (error) {
        console.error("History Check Error:", error);
        return NextResponse.json({ error: "Check failed" }, { status: 500 });
    }
}
