import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const davetUpdateSchema = z.object({
    sahip: z.string().min(1).optional(),
    tur: z.string().optional(),
    tarih: z.string().optional(),
    saat: z.string().optional(),
    yer: z.string().optional(),
    aciklama: z.string().optional(),
    getiren: z.string().optional(),
    gelis_sekli: z.string().optional(),
    gelis_tarih: z.string().optional(),
    katilim_durumu: z.string().optional(),
    iletisim: z.string().optional(),
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
        const validated = davetUpdateSchema.parse(body);

        const data: any = { ...validated };
        if (data.tarih) data.tarih = new Date(data.tarih);
        if (data.gelis_tarih) data.gelis_tarih = new Date(data.gelis_tarih);

        const item = await prisma.resmi_davetler.update({
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
        await prisma.resmi_davetler.delete({ where: { id: parseInt(paramId) } });
        return NextResponse.json({ message: "Silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Hata" }, { status: 500 });
    }
}
