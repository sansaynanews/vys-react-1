import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest, props: { params: Promise<{ docId: string }> }) {
    const params = await props.params;
    const docId = parseInt(params.docId);
    if (isNaN(docId)) {
        return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
    }

    try {
        // Önce belgeyi bul
        const doc = await prisma.toplanti_dokumanlari.findUnique({
            where: { id: docId }
        });

        if (!doc) {
            return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 });
        }

        // Veritabanından sil
        await prisma.toplanti_dokumanlari.delete({
            where: { id: docId }
        });

        // Dosyayı diskten silmeye çalış (Opsiyonel, hata verirse devam et)
        try {
            const relativePath = doc.dosya_yolu.startsWith('/') ? doc.dosya_yolu.slice(1) : doc.dosya_yolu;
            const filePath = join(process.cwd(), 'public', relativePath);
            await unlink(filePath);
        } catch (fileError) {
            console.warn("Dosya silinemedi (muhtemelen zaten yok):", fileError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Belge silme hatası:", error);
        return NextResponse.json({ error: 'Veritabanı hatası' }, { status: 500 });
    }
}
