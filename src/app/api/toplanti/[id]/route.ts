
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        await prisma.salon_rezervasyonlari.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Silme hatası:", error);
        return NextResponse.json({ success: false, error: "Silinemedi." }, { status: 500 });
    }
}
