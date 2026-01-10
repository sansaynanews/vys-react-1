
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        await prisma.toplanti_salonlari.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Salon silme hatası:", error);
        return NextResponse.json({ success: false, error: "Silinemedi." }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        const body = await req.json();
        const { ad, kapasite, konum, ekipman, notlar } = body;

        await prisma.toplanti_salonlari.update({
            where: { id },
            data: {
                ad,
                kapasite: Number(kapasite),
                konum: konum || null,
                ekipman: ekipman || null,
                notlar: notlar || null
            }
        });

        return NextResponse.json({ success: true, message: "Salon güncellendi." });
    } catch (error) {
        console.error("Salon güncelleme hatası:", error);
        return NextResponse.json({ success: false, error: "Güncellenemedi." }, { status: 500 });
    }
}
