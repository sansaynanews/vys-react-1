import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const toplantiId = parseInt(params.id);
    if (isNaN(toplantiId)) {
        return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
    }

    try {
        const body = await request.json(); // { dosya_adi, dosya_yolu, dosya_tipi, dosya_boyut }

        const doc = await prisma.toplanti_dokumanlari.create({
            data: {
                toplanti_id: toplantiId,
                dosya_adi: body.dosya_adi,
                dosya_yolu: body.dosya_yolu,
                dosya_tipi: body.dosya_tipi,
                dosya_boyut: body.dosya_boyut,
            }
        });
        return NextResponse.json(doc);
    } catch (error) {
        console.error("Belge kaydetme hatası:", error);
        return NextResponse.json({ error: 'Veritabanı hatası' }, { status: 500 });
    }
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const toplantiId = parseInt(params.id);
    if (isNaN(toplantiId)) {
        return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
    }

    try {
        const docs = await prisma.toplanti_dokumanlari.findMany({
            where: { toplanti_id: toplantiId },
            orderBy: { yukleme_tarihi: 'desc' }
        });
        return NextResponse.json(docs);
    } catch (error) {
        console.error("Belge getirme hatası:", error);
        return NextResponse.json({ error: 'Veritabanı hatası' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    // Burada params.id aslında documentId olmalı ama yapı gereği parent ID geliyor.
    // DELETE methodu genellikle /api/toplanti/dokuman/[docId] şeklinde olmalıydı.
    // Ancak pratiklik olsun diye body'den docId alabiliriz veya yeni route açabiliriz.
    // Şimdilik sadece Ekleme ve Listeleme yapalım. Silme gerekirse ayrı route açarım.
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
