import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'Dosya bulunamadı' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Uploads klasörünü oluştur
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'kararlar');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Klasör zaten varsa devam et
        }

        // Benzersiz dosya adı oluştur
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        // Türkçe karakterleri ve boşlukları temizle
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${uniqueSuffix}-${cleanName}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);

        // Public URL
        const publicPath = `/uploads/kararlar/${filename}`;

        return NextResponse.json({
            success: true,
            path: publicPath,
            filename: file.name,
            type: file.type,
            size: file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: 'Yükleme hatası' }, { status: 500 });
    }
}
