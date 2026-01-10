
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        const body = await req.json();

        // Gelen veriler
        const {
            start, end, resourceId,
            type, description, format, equipment, participants, catering, press, agenda, status, isProtocol
        } = body;

        const updateData: any = {};

        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);

            // Tarih (gün) güncelle
            updateData.tarih = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);

            // Saatleri güncelle
            updateData.bas_saat = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            updateData.bit_saat = endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }

        if (resourceId) {
            updateData.salon_id = Number(resourceId);
            // Salon adını güncelle
            const salon = await prisma.toplanti_salonlari.findUnique({ where: { id: Number(resourceId) } });
            if (salon) updateData.salon_ad = salon.ad;
        }

        // Diğer Alanlar
        if (type !== undefined) updateData.tur = type;
        if (format !== undefined) updateData.toplanti_format = format;
        if (equipment !== undefined) updateData.ekipmanlar = equipment;
        if (participants !== undefined) updateData.katilimci_listesi = participants;
        if (catering !== undefined) updateData.ikram_talebi = catering;
        if (press !== undefined) updateData.fotograf_basin = press;
        if (agenda !== undefined) updateData.gundem_maddeleri = agenda;
        if (status !== undefined) updateData.durum = status;

        if (isProtocol !== undefined || description !== undefined) {
            const desc = description || "";
            updateData.kararlar = isProtocol
                ? (desc ? `PROTOKOL - ${desc}` : "PROTOKOL")
                : desc;
        }

        const updated = await prisma.salon_rezervasyonlari.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, data: updated });

    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return NextResponse.json({ success: false, error: "Güncellenemedi." }, { status: 500 });
    }
}
