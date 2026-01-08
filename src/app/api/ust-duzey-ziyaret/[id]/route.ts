import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const ustDuzeyZiyaretSchema = z.object({
  protokol_turu: z.string().optional(),
  ad_soyad: z.string().optional(),
  gelis_tarihi: z.string().optional(),
  gelis_saati: z.string().optional(),
  karsilama_yeri: z.string().optional(),
  konaklama_yeri: z.string().optional(),
  notlar: z.string().optional(),
});

// GET - Tekil üst düzey ziyaret
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

    const ziyaret = await prisma.ust_duzey_ziyaret.findUnique({
      where: { id },
    });

    if (!ziyaret) {
      return NextResponse.json({ error: "Ziyaret bulunamadı" }, { status: 404 });
    }

    const formattedZiyaret = {
      ...ziyaret,
      gelis_tarihi: ziyaret.gelis_tarihi ? dayjs(ziyaret.gelis_tarihi).format("YYYY-MM-DD") : null,
      created_at: ziyaret.created_at ? dayjs(ziyaret.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedZiyaret);
  } catch (error) {
    console.error("Ust Duzey Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "Ziyaret getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Üst düzey ziyaret güncelle
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
    const validated = ustDuzeyZiyaretSchema.parse(body);

    await prisma.ust_duzey_ziyaret.update({
      where: { id },
      data: {
        protokol_turu: validated.protokol_turu || null,
        ad_soyad: validated.ad_soyad || null,
        gelis_tarihi: validated.gelis_tarihi ? new Date(validated.gelis_tarihi) : null,
        gelis_saati: validated.gelis_saati || null,
        karsilama_yeri: validated.karsilama_yeri || null,
        konaklama_yeri: validated.konaklama_yeri || null,
        notlar: validated.notlar || null,
      },
    });

    return NextResponse.json({
      message: "Üst düzey ziyaret başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Ust Duzey Ziyaret PUT Error:", error);
    return NextResponse.json(
      { error: "Ziyaret güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Üst düzey ziyaret sil
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

    await prisma.ust_duzey_ziyaret.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Üst düzey ziyaret başarıyla silindi",
    });
  } catch (error) {
    console.error("Ust Duzey Ziyaret DELETE Error:", error);
    return NextResponse.json(
      { error: "Ziyaret silinemedi" },
      { status: 500 }
    );
  }
}
