import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const sehitGaziSchema = z.object({
    tur: z.string().optional(), // Şehit Yakını / Gazi Yakını
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    kurum: z.string().optional(),
    medeni: z.string().optional(),
    es_ad: z.string().optional(),
    anne_ad: z.string().optional(),
    baba_ad: z.string().optional(),
    cocuk_sayisi: z.preprocess((val) => Number(val), z.number().optional()),
    cocuk_adlari: z.string().optional(),
    olay_yeri: z.string().optional(),
    olay_tarih: z.string().optional(),
    ziyaret_tarih: z.string().optional(),
    ziyaret_saat: z.string().optional(),
    talepler: z.string().optional(),
    aile_ferdi: z.string().optional(), // Yakınlık derecesi
});

// GET
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const where: any = {};
        if (search) {
            where.OR = [
                { ad_soyad: { contains: search } },
                { kurum: { contains: search } },
                { talepler: { contains: search } },
            ];
        }

        const items = await prisma.ziyaret_sehit_gazi.findMany({
            where,
            orderBy: { ziyaret_tarih: "desc" },
        });

        return NextResponse.json({
            data: items.map(item => ({
                ...item,
                ziyaret_tarih: item.ziyaret_tarih ? dayjs(item.ziyaret_tarih).format("YYYY-MM-DD") : null,
                olay_tarih: item.olay_tarih ? dayjs(item.olay_tarih).format("YYYY-MM-DD") : null,
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: "Liste getirilemedi" }, { status: 500 });
    }
}

// POST
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const body = await request.json();
        const validated = sehitGaziSchema.parse(body);

        const data: any = { ...validated };
        if (data.ziyaret_tarih) data.ziyaret_tarih = new Date(data.ziyaret_tarih);
        if (data.olay_tarih) data.olay_tarih = new Date(data.olay_tarih);

        const item = await prisma.ziyaret_sehit_gazi.create({ data });

        return NextResponse.json({
            message: "Kayıt başarılı",
            data: item,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}
