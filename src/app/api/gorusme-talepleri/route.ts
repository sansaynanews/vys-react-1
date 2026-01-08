import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const talepSchema = z.object({
    tarih: z.string().optional(), // Talep tarihi
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    kurum: z.string().optional(),
    konu: z.string().optional(),
    iletisim: z.string().optional(),
    durum: z.string().optional().default("Bekliyor"),
    notlar: z.string().optional(),
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
        const status = searchParams.get("status") || "";

        const where: any = {};
        if (search) {
            where.OR = [
                { ad_soyad: { contains: search } },
                { kurum: { contains: search } },
                { konu: { contains: search } },
            ];
        }
        if (status && status !== "Tümü") {
            where.durum = status;
        }

        const items = await prisma.gorusme_talepleri.findMany({
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
        console.error("Talep GET Error:", error);
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
        const validated = talepSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);
        else data.tarih = new Date(); // Default to now if not provided

        const item = await prisma.gorusme_talepleri.create({ data });

        return NextResponse.json({
            message: "Talep oluşturuldu",
            data: item,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}
