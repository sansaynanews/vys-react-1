import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const aracUpdateSchema = z.object({
  plaka: z.string().min(1).optional(),
  marka: z.string().min(1).optional(),
  model: z.string().optional(),
  model_yili: z.number().optional(),
  ruhsat_seri: z.string().optional(),
  lastik_ebat: z.string().optional(),
  renk: z.string().optional(),
  tur: z.string().optional(),
  yakit: z.string().optional(),
  kurum: z.string().optional(),
  bakim_son: z.string().optional(),
  bakim_sonraki: z.string().optional(),
  sigorta_bas: z.string().optional(),
  sigorta_bit: z.string().optional(),
  kasko_bas: z.string().optional(),
  kasko_bit: z.string().optional(),
  muayene_tarih: z.string().optional(),
  muayene_bit: z.string().optional(),
  bakim_son_km: z.number().optional(),
  bakim_sonraki_km: z.number().optional(),
  lastik_degisim_tarih: z.string().optional(),
  lastik_yili: z.string().optional(),
  periyodik_bakim_tarih: z.string().optional(),
  periyodik_bakim_km: z.number().optional(),
  agir_bakim_tarih: z.string().optional(),
  agir_bakim_km: z.number().optional(),
  diger_aciklama: z.string().optional(),
});

// GET - Tekil Araç
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

    const arac = await prisma.araclar.findUnique({
      where: { id },
    });

    if (!arac) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    // Format dates for frontend
    const formattedArac = {
      ...arac,
      muayene_bit: arac.muayene_bit ? dayjs(arac.muayene_bit).format("YYYY-MM-DD") : null,
      sigorta_bit: arac.sigorta_bit ? dayjs(arac.sigorta_bit).format("YYYY-MM-DD") : null,
      kasko_bit: arac.kasko_bit ? dayjs(arac.kasko_bit).format("YYYY-MM-DD") : null,
      bakim_son: arac.bakim_son ? dayjs(arac.bakim_son).format("YYYY-MM-DD") : null,
      sigorta_bas: arac.sigorta_bas ? dayjs(arac.sigorta_bas).format("YYYY-MM-DD") : null,
      kasko_bas: arac.kasko_bas ? dayjs(arac.kasko_bas).format("YYYY-MM-DD") : null,
      muayene_tarih: arac.muayene_tarih ? dayjs(arac.muayene_tarih).format("YYYY-MM-DD") : null,
      lastik_degisim_tarih: arac.lastik_degisim_tarih ? dayjs(arac.lastik_degisim_tarih).format("YYYY-MM-DD") : null,
      periyodik_bakim_tarih: arac.periyodik_bakim_tarih ? dayjs(arac.periyodik_bakim_tarih).format("YYYY-MM-DD") : null,
      agir_bakim_tarih: arac.agir_bakim_tarih ? dayjs(arac.agir_bakim_tarih).format("YYYY-MM-DD") : null,
    };

    return NextResponse.json({ data: formattedArac });
  } catch (error) {
    console.error("Araç GET Error:", error);
    return NextResponse.json(
      { error: "Araç bilgileri getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Güncelleme
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
    const validated = aracUpdateSchema.parse(body);

    // Tarih alanlarını dönüştürme
    const dateFields = [
      "bakim_son", "sigorta_bas", "sigorta_bit", "kasko_bas", "kasko_bit",
      "muayene_tarih", "muayene_bit", "lastik_degisim_tarih",
      "periyodik_bakim_tarih", "agir_bakim_tarih"
    ];

    const data: any = { ...validated };

    dateFields.forEach(field => {
      // @ts-ignore
      if (data[field]) {
        // @ts-ignore
        data[field] = new Date(data[field]);
      }
    });

    const arac = await prisma.araclar.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: "Araç başarıyla güncellendi",
      data: arac,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Araç PUT Error:", error);
    return NextResponse.json(
      { error: "Araç güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Silme
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

    await prisma.araclar.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Araç başarıyla silindi" });
  } catch (error) {
    console.error("Araç DELETE Error:", error);
    return NextResponse.json(
      { error: "Araç silinemedi" },
      { status: 500 }
    );
  }
}
