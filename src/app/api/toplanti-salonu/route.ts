import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation Schema
const salonSchema = z.object({
    ad: z.string().min(1, "Salon adı gerekli"),
    kapasite: z.preprocess((val) => Number(val), z.number().optional()),
    konum: z.string().optional(),
    ekipman: z.string().optional(),
    notlar: z.string().optional(),
});

// GET - Salon Listesi
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
                { ad: { contains: search } },
                { konum: { contains: search } },
            ];
        }

        const salonlar = await prisma.toplanti_salonlari.findMany({
            where,
            orderBy: { ad: "asc" },
        });

        return NextResponse.json({ data: salonlar });
    } catch (error) {
        console.error("Salon GET Error:", error);
        return NextResponse.json(
            { error: "Salon listesi getirilemedi" },
            { status: 500 }
        );
    }
}

// POST - Yeni Salon
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const body = await request.json();
        const validated = salonSchema.parse(body);

        const salon = await prisma.toplanti_salonlari.create({
            data: validated,
        });

        return NextResponse.json({
            message: "Salon başarıyla oluşturuldu",
            data: salon,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validasyon hatası", details: error.issues },
                { status: 400 }
            );
        }
        console.error("Salon POST Error:", error);
        return NextResponse.json(
            { error: "Salon oluşturulamadı" },
            { status: 500 }
        );
    }
}
