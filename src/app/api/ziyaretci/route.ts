import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const ziyaretciSchema = z.object({
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    kurum: z.string().optional(),
    unvan: z.string().optional(),
    iletisim: z.string().optional(),
    giris_tarihi: z.string().optional(), // YYYY-MM-DD
    giris_saati: z.string().min(1, "Giriş saati gerekli"),
    cikis_saati: z.string().optional(),
    kisi_sayisi: z.preprocess((val) => Number(val), z.number().min(1).default(1)),
    diger_kisiler: z.string().optional(),
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
        // Default to today if no date provided
        const date = searchParams.get("date") || dayjs().format("YYYY-MM-DD");

        const where: any = {};

        // Tarih bazlı veya tümü
        if (date) {
            where.giris_tarihi = new Date(date);
        }

        if (search) {
            where.OR = [
                { ad_soyad: { contains: search } },
                { kurum: { contains: search } },
            ];
        }

        const ziyaretciler = await prisma.ziyaretci_kayitlari.findMany({
            where,
            orderBy: { giris_saati: "desc" },
        });

        return NextResponse.json({
            data: ziyaretciler.map(z => ({
                ...z,
                giris_tarihi: dayjs(z.giris_tarihi).format("YYYY-MM-DD")
            }))
        });
    } catch (error) {
        console.error("Ziyaretçi GET Error:", error);
        return NextResponse.json(
            { error: "Liste getirilemedi" },
            { status: 500 }
        );
    }
}

// POST - Create (Check-in)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const body = await request.json();
        const validated = ziyaretciSchema.parse(body);

        const ziyaretci = await prisma.ziyaretci_kayitlari.create({
            data: {
                ...validated,
                giris_tarihi: new Date(validated.giris_tarihi || new Date())
            },
        });

        return NextResponse.json({
            message: "Giriş kaydı oluşturuldu",
            data: ziyaretci,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validasyon hatası", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Ziyaretçi POST Error:", error);
        return NextResponse.json(
            { error: "Kayıt oluşturulamadı" },
            { status: 500 }
        );
    }
}
