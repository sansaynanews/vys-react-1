import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const amirSchema = z.object({
    ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
    kurum_adi: z.string().min(1, "Kurum adı gerekli"),
    unvan: z.string().optional(),
    email: z.string().email("Geçerli bir email giriniz").optional().or(z.literal("")),
    gsm: z.string().optional(),
    sabit_tel: z.string().optional(),
    foto: z.string().optional(), // URL for now
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
                { ad_soyad: { contains: search } },
                { kurum_adi: { contains: search } },
                { unvan: { contains: search } },
            ];
        }

        const amirler = await prisma.kurum_amirleri.findMany({
            where,
            orderBy: { ad_soyad: "asc" },
        });

        return NextResponse.json({ data: amirler });
    } catch (error) {
        console.error("Kurum Amirleri GET Error:", error);
        return NextResponse.json(
            { error: "Liste getirilemedi" },
            { status: 500 }
        );
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
        const validated = amirSchema.parse(body);

        const amir = await prisma.kurum_amirleri.create({
            data: validated,
        });

        return NextResponse.json({
            message: "Kayıt başarıyla oluşturuldu",
            data: amir,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validasyon hatası", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Kurum Amirleri POST Error:", error);
        return NextResponse.json(
            { error: "Kayıt oluşturulamadı" },
            { status: 500 }
        );
    }
}
