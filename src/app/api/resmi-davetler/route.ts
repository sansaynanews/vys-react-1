import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const davetSchema = z.object({
    sahip: z.string().min(1, "Davet Sahibi gerekli"),
    tur: z.string().optional(),
    tarih: z.string().optional(), // Event Date
    saat: z.string().optional(),
    yer: z.string().optional(),
    aciklama: z.string().optional(),
    getiren: z.string().optional(),
    gelis_sekli: z.string().optional(),
    gelis_tarih: z.string().optional(), // Received Date
    katilim_durumu: z.string().optional().default("Belirsiz"),
    iletisim: z.string().optional(),
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
                { sahip: { contains: search } },
                { yer: { contains: search } },
                { aciklama: { contains: search } },
            ];
        }
        if (status && status !== "Tümü") {
            where.katilim_durumu = status;
        }

        const items = await prisma.resmi_davetler.findMany({
            where,
            orderBy: { tarih: "desc" },
        });

        return NextResponse.json({
            data: items.map(item => ({
                ...item,
                tarih: item.tarih ? dayjs(item.tarih).format("YYYY-MM-DD") : null,
                gelis_tarih: item.gelis_tarih ? dayjs(item.gelis_tarih).format("YYYY-MM-DD") : null,
            }))
        });
    } catch (error) {
        console.error("Davet GET Error:", error);
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
        const validated = davetSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);
        if (data.gelis_tarih) data.gelis_tarih = new Date(data.gelis_tarih);

        const item = await prisma.resmi_davetler.create({ data });

        return NextResponse.json({
            message: "Davet eklendi",
            data: item,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}
