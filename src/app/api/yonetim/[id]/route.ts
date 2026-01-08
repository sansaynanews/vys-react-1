import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userUpdateSchema = z.object({
    kadi: z.string().optional(),
    sifre: z.string().optional(),
    yetki: z.string().optional(),
    ad_soyad: z.string().optional(),
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
        const validated = userUpdateSchema.parse(body);

        const data: any = { ...validated };

        // Only update password if provided and not empty
        if (!data.sifre) {
            delete data.sifre;
        }

        const item = await prisma.yonetim.update({
            where: { id: parseInt(paramId) },
            data,
        });

        return NextResponse.json({
            message: "Güncellendi",
            data: { id: item.id, kadi: item.kadi, yetki: item.yetki }
        });
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
        await prisma.yonetim.delete({ where: { id: parseInt(paramId) } });
        return NextResponse.json({ message: "Silindi" });
    } catch (error) {
        return NextResponse.json({ error: "Hata" }, { status: 500 });
    }
}
