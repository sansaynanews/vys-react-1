import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const konusmaUpdateSchema = z.object({
    baslik: z.string().optional(),
    kategori: z.string().optional(),
    icerik: z.string().optional(),
    tarih: z.string().optional(),
    saat: z.string().optional(),
});

// PUT
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
        const body = await request.json();
        const validated = konusmaUpdateSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);
        if (data.saat) {
            const [hours, minutes] = data.saat.split(':');
            const d = new Date();
            d.setHours(parseInt(hours), parseInt(minutes), 0);
            data.saat = d;
        }

        const item = await prisma.konusma_metinleri.update({
            where: { id: parseInt(paramId) },
            data,
        });

        return NextResponse.json({ message: "Güncellendi", data: item });
    } catch (error) {
        return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
    }
}

// DELETE
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
        await prisma.konusma_metinleri.delete({ where: { id: parseInt(paramId) } });
        return NextResponse.json({ message: "Silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Hata" }, { status: 500 });
    }
}
