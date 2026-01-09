import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ad_soyad = searchParams.get("ad_soyad");

        if (!ad_soyad || ad_soyad.length < 3) {
            return NextResponse.json({ risk: null });
        }

        // Basit bir örnek eşleşme (Gerçekte daha karmaşık fuzzy search olabilir)
        const kayit = await prisma.guvenlik_kayitlari.findFirst({
            where: {
                ad_soyad: {
                    contains: ad_soyad
                }
            }
        });

        if (kayit) {
            return NextResponse.json({
                risk: {
                    seviye: kayit.risk_seviyesi,
                    mesaj: kayit.durum_notu
                }
            });
        }

        return NextResponse.json({ risk: null });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Check failed" }, { status: 500 });
    }
}
