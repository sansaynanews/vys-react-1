import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const salonUpdateSchema = z.object({
    ad: z.string().min(1).optional(),
    kapasite: z.preprocess((val) => Number(val), z.number().optional()),
    konum: z.string().optional(),
    ekipman: z.string().optional(),
    notlar: z.string().optional(),
});

// GET - Tekil Salon
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const { id: paramId } = await params;
        const id = parseInt(paramId);

        const salon = await prisma.toplanti_salonlari.findUnique({
            where: { id },
        });

        if (!salon) {
            return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
        }

        return NextResponse.json({ data: salon });
    } catch (error) {
        console.error("Salon GET Error:", error);
        return NextResponse.json(
            { error: "Salon bilgileri getirilemedi" },
            { status: 500 }
        );
    }
}

// PUT - Güncelleme
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const body = await request.json();
        const validated = salonUpdateSchema.parse(body);

        const salon = await prisma.toplanti_salonlari.update({
            where: { id },
            data: validated,
        });

        return NextResponse.json({
            message: "Salon başarıyla güncellendi",
            data: salon,
        });
    } catch (error) {
        console.error("Salon PUT Error:", error);
        return NextResponse.json(
            { error: "Salon güncellenemedi" },
            { status: 500 }
        );
    }
}

// DELETE - Silme
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const { id: paramId } = await params;
        const id = parseInt(paramId);

        // Bağlı rezervasyon var mı kontrolü?
        // Şimdilik direkt siliyoruz, fakat gerçek senaryoda rezervasyonları da kontrol etmek gerekebilir.
        await prisma.toplanti_salonlari.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Salon başarıyla silindi" });
    } catch (error) {
        console.error("Salon DELETE Error:", error);
        return NextResponse.json(
            { error: "Salon silinemedi" },
            { status: 500 }
        );
    }
}
