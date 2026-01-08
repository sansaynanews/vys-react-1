import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const sehitGaziBilgiSchema = z.object({
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
  foto: z.string().optional(),
});

// GET - Tekil şehit/gazi bilgi
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

    const kayit = await prisma.sehit_gazi_bilgi.findUnique({
      where: { id },
    });

    if (!kayit) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    const formattedKayit = {
      ...kayit,
      olay_tarih: kayit.olay_tarih ? dayjs(kayit.olay_tarih).format("YYYY-MM-DD") : null,
      created_at: kayit.created_at ? dayjs(kayit.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedKayit);
  } catch (error) {
    console.error("Sehit Gazi Bilgi GET Error:", error);
    return NextResponse.json(
      { error: "Kayıt getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Şehit/gazi bilgi güncelle
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
    const validated = sehitGaziBilgiSchema.parse(body);

    await prisma.sehit_gazi_bilgi.update({
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
        foto: validated.foto || null,
      },
    });

    return NextResponse.json({
      message: "Şehit/Gazi bilgisi başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sehit Gazi Bilgi PUT Error:", error);
    return NextResponse.json(
      { error: "Kayıt güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Şehit/gazi bilgi sil
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

    await prisma.sehit_gazi_bilgi.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Kayıt başarıyla silindi",
    });
  } catch (error) {
    console.error("Sehit Gazi Bilgi DELETE Error:", error);
    return NextResponse.json(
      { error: "Kayıt silinemedi" },
      { status: 500 }
    );
  }
}
