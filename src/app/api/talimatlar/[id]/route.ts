import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const talimatUpdateSchema = z.object({
    konu: z.string().min(1).optional(),
    verilen_kisi: z.string().optional(),
    kurum: z.string().optional(),
    iletisim: z.string().optional(),
    tarih: z.string().optional(),
    durum: z.string().optional(),
    icerik: z.string().optional(),
    onem_derecesi: z.string().optional(),
    tamamlanma_tarihi: z.string().optional(),
    tamamlayan_kisi: z.string().optional(),
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
        const validated = talimatUpdateSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);
        if (data.tamamlanma_tarihi) data.tamamlanma_tarihi = new Date(data.tamamlanma_tarihi);

        const item = await prisma.talimatlar.update({
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
        await prisma.talimatlar.delete({ where: { id: parseInt(paramId) } });
        return NextResponse.json({ message: "Silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Hata" }, { status: 500 });
    }
}
