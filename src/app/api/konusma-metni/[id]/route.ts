import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const konusmaMetniSchema = z.object({
  kategori: z.string().min(1, "Kategori gerekli"),
  baslik: z.string().min(1, "Başlık gerekli"),
  icerik: z.string().min(1, "İçerik gerekli"),
  tarih: z.string().optional(),
  saat: z.string().optional(),
});

// GET - Tekil konuşma metni
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

    const metin = await prisma.konusma_metinleri.findUnique({
      where: { id },
    });

    if (!metin) {
      return NextResponse.json({ error: "Konuşma metni bulunamadı" }, { status: 404 });
    }

    const formattedMetin = {
      ...metin,
      tarih: metin.tarih ? dayjs(metin.tarih).format("YYYY-MM-DD") : null,
      created_at: metin.created_at ? dayjs(metin.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedMetin);
  } catch (error) {
    console.error("Konusma Metni GET Error:", error);
    return NextResponse.json(
      { error: "Konuşma metni getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Konuşma metni güncelle
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
    const validated = konusmaMetniSchema.parse(body);

    await prisma.konusma_metinleri.update({
      where: { id },
      data: {
        kategori: validated.kategori,
        baslik: validated.baslik,
        icerik: validated.icerik,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        saat: validated.saat ? validated.saat : null,
      },
    });

    return NextResponse.json({
      message: "Konuşma metni başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Konusma Metni PUT Error:", error);
    return NextResponse.json(
      { error: "Konuşma metni güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Konuşma metni sil
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

    await prisma.konusma_metinleri.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Konuşma metni başarıyla silindi",
    });
  } catch (error) {
    console.error("Konusma Metni DELETE Error:", error);
    return NextResponse.json(
      { error: "Konuşma metni silinemedi" },
      { status: 500 }
    );
  }
}
