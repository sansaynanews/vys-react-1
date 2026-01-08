import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const sehitGaziZiyaretSchema = z.object({
  tur: z.string().optional(),
  ad_soyad: z.string().optional(),
  kurum: z.string().optional(),
  medeni: z.string().optional(),
  es_ad: z.string().optional(),
  anne_ad: z.string().optional(),
  baba_ad: z.string().optional(),
  cocuk_sayisi: z.number().optional(),
  cocuk_adlari: z.string().optional(),
  olay_yeri: z.string().optional(),
  olay_tarih: z.string().optional(),
  ziyaret_tarih: z.string().optional(),
  ziyaret_saat: z.string().optional(),
  talepler: z.string().optional(),
  aile_ferdi: z.string().optional(),
  saat: z.string().optional(),
});

// GET - Tekil şehit/gazi ziyaret
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

    const ziyaret = await prisma.ziyaret_sehit_gazi.findUnique({
      where: { id },
    });

    if (!ziyaret) {
      return NextResponse.json({ error: "Ziyaret bulunamadı" }, { status: 404 });
    }

    const formattedZiyaret = {
      ...ziyaret,
      olay_tarih: ziyaret.olay_tarih ? dayjs(ziyaret.olay_tarih).format("YYYY-MM-DD") : null,
      ziyaret_tarih: ziyaret.ziyaret_tarih ? dayjs(ziyaret.ziyaret_tarih).format("YYYY-MM-DD") : null,
      created_at: ziyaret.created_at ? dayjs(ziyaret.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedZiyaret);
  } catch (error) {
    console.error("Sehit Gazi Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "Ziyaret getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Şehit/gazi ziyaret güncelle
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
    const validated = sehitGaziZiyaretSchema.parse(body);

    await prisma.ziyaret_sehit_gazi.update({
      where: { id },
      data: {
        tur: validated.tur || null,
        ad_soyad: validated.ad_soyad || null,
        kurum: validated.kurum || null,
        medeni: validated.medeni || null,
        es_ad: validated.es_ad || null,
        anne_ad: validated.anne_ad || null,
        baba_ad: validated.baba_ad || null,
        cocuk_sayisi: validated.cocuk_sayisi || null,
        cocuk_adlari: validated.cocuk_adlari || null,
        olay_yeri: validated.olay_yeri || null,
        olay_tarih: validated.olay_tarih ? new Date(validated.olay_tarih) : null,
        ziyaret_tarih: validated.ziyaret_tarih ? new Date(validated.ziyaret_tarih) : null,
        ziyaret_saat: validated.ziyaret_saat || null,
        talepler: validated.talepler || null,
        aile_ferdi: validated.aile_ferdi || null,
        saat: validated.saat || null,
      },
    });

    return NextResponse.json({
      message: "Ziyaret kaydı başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sehit Gazi Ziyaret PUT Error:", error);
    return NextResponse.json(
      { error: "Ziyaret kaydı güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Şehit/gazi ziyaret sil
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

    await prisma.ziyaret_sehit_gazi.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Ziyaret kaydı başarıyla silindi",
    });
  } catch (error) {
    console.error("Sehit Gazi Ziyaret DELETE Error:", error);
    return NextResponse.json(
      { error: "Ziyaret kaydı silinemedi" },
      { status: 500 }
    );
  }
}
