import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const kamuZiyaretSchema = z.object({
    kurum: z.string().min(1, "Ad Soyad/Kurum gerekli"),
    yer: z.string().optional(),
    tarih: z.string().optional(), // YYYY-MM-DD
    saat: z.string().optional(),
    talepler: z.string().optional(),
});

// GET - List
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
                { kurum: { contains: search } },
                { talepler: { contains: search } },
            ];
        }

        const items = await prisma.ziyaret_kamu.findMany({
            where,
            orderBy: { tarih: "desc" },
        });

        return NextResponse.json({
            data: items.map(item => ({
                ...item,
                tarih: item.tarih ? dayjs(item.tarih).format("YYYY-MM-DD") : null,
            }))
        });
    } catch (error) {
        console.error("Kamu Ziyaret GET Error:", error);
        return NextResponse.json({ error: "Liste getirilemedi" }, { status: 500 });
    }
}

// POST - Create
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const body = await request.json();
        const validated = kamuZiyaretSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);

        const item = await prisma.ziyaret_kamu.create({ data });

        return NextResponse.json({
            message: "Ziyaret kaydedildi",
            data: item,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}
