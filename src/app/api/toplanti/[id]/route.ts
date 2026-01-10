
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = Number(params.id);

        // 1. İlgili dosyaları bul
        const docs = await prisma.toplanti_dokumanlari.findMany({
            where: { toplanti_id: id }
        });

        // 2. Fiziksel dosyaları sil
        for (const doc of docs) {
            try {
                // Dosya yolları genellikle "/uploads/..." şeklindedir. Baştaki "/" işaretini kaldırarak path.join ile kullanmalıyız.
                const filePath = path.join(process.cwd(), 'public', doc.dosya_yolu.replace(/^\//, ''));
                await fs.unlink(filePath);
            } catch (err) {
                console.error("Fiziksel dosya silinemedi:", doc.dosya_yolu, err);
                // Dosya zaten yoksa devam et
            }
        }

        // 3. Veritabanı kaydını sil (Cascade ile dokuman kayıtları da silinir)
        await prisma.salon_rezervasyonlari.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Silme hatası:", error);
        return NextResponse.json({ success: false, error: "Silinemedi: " + (error.message || String(error)) }, { status: 500 });
    }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = Number(params.id);
        const body = await req.json();

        // Gelen veriler
        const {
            title, organizer, start, end, resourceId,
            type, description, format, equipment, participants, catering, press, agenda,
            status, statusReason, postponedDate, approvedBy, isProtocol
        } = body;

        const updateData: any = {};

        if (title !== undefined) updateData.baslik = title;
        if (organizer !== undefined) updateData.rez_sahibi = organizer;
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
        if (statusReason !== undefined) updateData.durum_aciklamasi = statusReason;
        if (postponedDate !== undefined) updateData.ertelenen_tarih = postponedDate ? new Date(postponedDate) : null;
        if (approvedBy !== undefined) updateData.onaylayan = approvedBy;

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
