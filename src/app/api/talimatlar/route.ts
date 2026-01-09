import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const talimatSchema = z.object({
    konu: z.string().min(1, "Konu gerekli"),
    verilen_kisi: z.string().min(1, "Verilen kişi/kurum gerekli"),
    kurum: z.string().optional(),
    iletisim: z.string().optional(),
    tarih: z.string().optional(), // Deadline or Given Date
    durum: z.string().optional().default("Beklemede"),
    icerik: z.string().optional(),
    onem_derecesi: z.string().optional().default("Normal"),
    tamamlanma_tarihi: z.string().optional(),
    tamamlayan_kisi: z.string().optional(),
    // Randevu bağlantısı
    randevu_id: z.number().optional(),
    randevu_bilgi: z.string().optional(),
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
                { verilen_kisi: { contains: search } },
                { kurum: { contains: search } },
            ];
        }
        if (status && status !== "Tümü") {
            where.durum = status;
        }

        const items = await prisma.talimatlar.findMany({
            where,
            orderBy: { tarih: "desc" },
        });

        return NextResponse.json({
            data: items.map(item => ({
                ...item,
                tarih: item.tarih ? dayjs(item.tarih).format("YYYY-MM-DD") : null,
                tamamlanma_tarihi: item.tamamlanma_tarihi ? dayjs(item.tamamlanma_tarihi).format("YYYY-MM-DD") : null,
            }))
        });
    } catch (error) {
        console.error("Talimat GET Error:", error);
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
        const validated = talimatSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);
        if (data.tamamlanma_tarihi) data.tamamlanma_tarihi = new Date(data.tamamlanma_tarihi);

        const item = await prisma.talimatlar.create({ data });

        return NextResponse.json({
            message: "Talimat oluşturuldu",
            data: item,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}
