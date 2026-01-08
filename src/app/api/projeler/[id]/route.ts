import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const projeUpdateSchema = z.object({
    konu: z.string().optional(),
    sahibi: z.string().optional(),
    kurum: z.string().optional(),
    iletisim: z.string().optional(),
    baslangic: z.string().optional(),
    bitis: z.string().optional(),
    durum: z.string().optional(),
    hedefler: z.string().optional(),
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
        const validated = projeUpdateSchema.parse(body);

        const data: any = { ...validated };
        if (data.baslangic) data.baslangic = new Date(data.baslangic);
        if (data.bitis) data.bitis = new Date(data.bitis);

        const item = await prisma.projeler.update({
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
        await prisma.projeler.delete({ where: { id: parseInt(paramId) } });
        return NextResponse.json({ message: "Silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Hata" }, { status: 500 });
    }
}
