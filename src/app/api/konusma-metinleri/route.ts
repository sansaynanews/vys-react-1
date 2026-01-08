import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const konusmaSchema = z.object({
    baslik: z.string().min(1, "Başlık gerekli"),
    kategori: z.string().min(1, "Kategori gerekli"),
    icerik: z.string().min(1, "İçerik gerekli"),
    tarih: z.string().optional(),
    saat: z.string().optional(),
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
        const category = searchParams.get("category") || "";

        const where: any = {};
        if (search) {
            where.OR = [
                { baslik: { contains: search } },
                { icerik: { contains: search } },
            ];
        }
        if (category && category !== "Tümü") {
            where.kategori = category;
        }

        const items = await prisma.konusma_metinleri.findMany({
            where,
            orderBy: { tarih: "desc" },
        });

        return NextResponse.json({
            data: items.map(item => ({
                ...item,
                tarih: item.tarih ? dayjs(item.tarih).format("YYYY-MM-DD") : null,
                saat: item.saat ? dayjs(item.saat).format("HH:mm") : null,
            }))
        });
    } catch (error) {
        console.error("Konuşma API Error:", error);
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
        const validated = konusmaSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);
        // Saat handling might need adjustment if it's DateTime in DB but string in Form. 
        // Schema says @db.Time(0) for saat, but generated client usually maps this to Date object with dummy date.
        // For simplicity, we'll try to parse it if provided.
        if (data.saat) {
            const [hours, minutes] = data.saat.split(':');
            const d = new Date();
            d.setHours(parseInt(hours), parseInt(minutes), 0);
            data.saat = d;
        } else {
            delete data.saat; // Let DB default handle it if set
        }

        const item = await prisma.konusma_metinleri.create({ data });

        return NextResponse.json({
            message: "Konuşma metni eklendi",
            data: item,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
    }
}
