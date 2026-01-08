import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const projeSchema = z.object({
    konu: z.string().min(1, "Proje konusu (adı) gerekli"),
    sahibi: z.string().min(1, "Proje sahibi gerekli"),
    kurum: z.string().optional(),
    iletisim: z.string().optional(),
    baslangic: z.string().optional(),
    bitis: z.string().optional(),
    durum: z.string().optional().default("Beklemede"),
    hedefler: z.string().optional(),
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
                { konu: { contains: search } },
                { sahibi: { contains: search } },
                { kurum: { contains: search } },
            ];
        }
        if (status && status !== "Tümü") {
            where.durum = status;
        }

        const items = await prisma.projeler.findMany({
            where,
            orderBy: { baslangic: "desc" },
        });

        return NextResponse.json({
            data: items.map(item => ({
                ...item,
                baslangic: item.baslangic ? dayjs(item.baslangic).format("YYYY-MM-DD") : null,
                bitis: item.bitis ? dayjs(item.bitis).format("YYYY-MM-DD") : null,
            }))
        });
    } catch (error) {
        console.error("Proje API Error:", error);
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
        const validated = projeSchema.parse(body);

        const data: any = { ...validated };
        if (data.baslangic) data.baslangic = new Date(data.baslangic);
        if (data.bitis) data.bitis = new Date(data.bitis);

        const item = await prisma.projeler.create({ data });

        return NextResponse.json({
            message: "Proje oluşturuldu",
            data: item,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}
