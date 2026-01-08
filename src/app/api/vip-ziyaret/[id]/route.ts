import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const vipZiyaretSchema = z.object({
  protokol_turu: z.string().min(1, "Protokol türü gerekli"),
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  gelis_tarihi: z.string().optional(),
  gelis_saati: z.string().optional(),
  karsilama_yeri: z.string().optional(),
  konaklama_yeri: z.string().optional(),
  notlar: z.string().optional(),
});

// GET - Tekil VIP ziyaret
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
      return NextResponse.json({ error: "VIP ziyaret bulunamadı" }, { status: 404 });
    }

    const formattedZiyaret = {
      ...ziyaret,
      gelis_tarihi: ziyaret.gelis_tarihi ? dayjs(ziyaret.gelis_tarihi).format("YYYY-MM-DD") : null,
      created_at: ziyaret.created_at ? dayjs(ziyaret.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedZiyaret);
  } catch (error) {
    console.error("VIP Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "VIP ziyaret getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - VIP ziyaret güncelle
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
    const validated = vipZiyaretSchema.parse(body);

    await prisma.ust_duzey_ziyaret.update({
      where: { id },
      data: {
        protokol_turu: validated.protokol_turu,
        ad_soyad: validated.ad_soyad,
        gelis_tarihi: validated.gelis_tarihi ? new Date(validated.gelis_tarihi) : null,
        gelis_saati: validated.gelis_saati || null,
        karsilama_yeri: validated.karsilama_yeri || null,
        konaklama_yeri: validated.konaklama_yeri || null,
        notlar: validated.notlar || null,
      },
    });

    return NextResponse.json({
      message: "VIP ziyaret başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("VIP Ziyaret PUT Error:", error);
    return NextResponse.json(
      { error: "VIP ziyaret güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - VIP ziyaret sil
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
      message: "VIP ziyaret başarıyla silindi",
    });
  } catch (error) {
    console.error("VIP Ziyaret DELETE Error:", error);
    return NextResponse.json(
      { error: "VIP ziyaret silinemedi" },
      { status: 500 }
    );
  }
}
