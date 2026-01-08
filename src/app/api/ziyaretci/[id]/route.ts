import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ziyaretciUpdateSchema = z.object({
    ad_soyad: z.string().min(1).optional(),
    kurum: z.string().optional(),
    unvan: z.string().optional(),
    iletisim: z.string().optional(),
    giris_tarihi: z.string().optional(), // YYYY-MM-DD
    giris_saati: z.string().optional(),
    cikis_saati: z.string().optional(),
    kisi_sayisi: z.preprocess((val) => Number(val), z.number().optional()),
    diger_kisiler: z.string().optional(),
});

// GET
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
        const item = await prisma.ziyaretci_kayitlari.findUnique({ where: { id: parseInt(paramId) } });
        if (!item) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
        return NextResponse.json({ data: item });
    } catch (error) {
        return NextResponse.json({ error: "Hata" }, { status: 500 });
    }
}

// PUT - Update (Check-out or Edit)
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
        const validated = ziyaretciUpdateSchema.parse(body);

        const data: any = { ...validated };
        if (data.giris_tarihi) data.giris_tarihi = new Date(data.giris_tarihi);

        const updated = await prisma.ziyaretci_kayitlari.update({
            where: { id: parseInt(paramId) },
            data,
        });

        return NextResponse.json({
            message: "Güncellendi",
            data: updated,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Güncelleme başarısız" },
            { status: 500 }
        );
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
        await prisma.ziyaretci_kayitlari.delete({ where: { id: parseInt(paramId) } });
        return NextResponse.json({ message: "Silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Hata" }, { status: 500 });
    }
}
