import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const amirUpdateSchema = z.object({
    ad_soyad: z.string().min(1).optional(),
    kurum_adi: z.string().min(1).optional(),
    unvan: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    gsm: z.string().optional(),
    sabit_tel: z.string().optional(),
    foto: z.string().optional(),
});

// GET - Single
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

        const amir = await prisma.kurum_amirleri.findUnique({
            where: { id },
        });

        if (!amir) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
        }

        return NextResponse.json({ data: amir });
    } catch (error) {
        return NextResponse.json(
            { error: "İşlem başarısız" },
            { status: 500 }
        );
    }
}

// PUT - Update
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
        const validated = amirUpdateSchema.parse(body);

        const updated = await prisma.kurum_amirleri.update({
            where: { id },
            data: validated,
        });

        return NextResponse.json({
            message: "Kayıt güncellendi",
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

// DELETE - Remove
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

        await prisma.kurum_amirleri.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Kayıt silindi" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Silme başarısız" },
            { status: 500 }
        );
    }
}
