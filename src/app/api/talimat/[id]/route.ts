import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const talimatSchema = z.object({
  konu: z.string().min(1, "Konu gerekli"),
  verilen_kisi: z.string().min(1, "Talimati veren kişi gerekli"),
  kurum: z.string().optional(),
  iletisim: z.string().optional(),
  tarih: z.string().optional(),
  durum: z.string().optional(),
  icerik: z.string().optional(),
  onem_derecesi: z.string().optional(),
  saat: z.string().optional(),
  tamamlanma_tarihi: z.string().optional().nullable(),
  tamamlayan_kisi: z.string().optional().nullable(),
});

// GET - Tekil talimat
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

    const talimat = await prisma.talimatlar.findUnique({
      where: { id },
    });

    if (!talimat) {
      return NextResponse.json({ error: "Talimat bulunamadı" }, { status: 404 });
    }

    const formattedTalimat = {
      ...talimat,
      tarih: talimat.tarih ? dayjs(talimat.tarih).format("YYYY-MM-DD") : null,
      tamamlanma_tarihi: talimat.tamamlanma_tarihi ? dayjs(talimat.tamamlanma_tarihi).format("YYYY-MM-DD") : null,
      created_at: talimat.created_at ? dayjs(talimat.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedTalimat);
  } catch (error) {
    console.error("Talimat GET Error:", error);
    return NextResponse.json(
      { error: "Talimat getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Talimat güncelle
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
    const validated = talimatSchema.parse(body);

    await prisma.talimatlar.update({
      where: { id },
      data: {
        konu: validated.konu,
        verilen_kisi: validated.verilen_kisi,
        kurum: validated.kurum || null,
        iletisim: validated.iletisim || null,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        durum: validated.durum || "Beklemede",
        icerik: validated.icerik || null,
        onem_derecesi: validated.onem_derecesi || "Normal",
        saat: validated.saat ? new Date(`1970-01-01T${validated.saat}`) : null,
        tamamlanma_tarihi: validated.tamamlanma_tarihi ? new Date(validated.tamamlanma_tarihi) : null,
        tamamlayan_kisi: validated.tamamlayan_kisi || null,
      },
    });

    return NextResponse.json({
      message: "Talimat başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Talimat PUT Error:", error);
    return NextResponse.json(
      { error: "Talimat güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Talimat sil
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

    await prisma.talimatlar.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Talimat başarıyla silindi",
    });
  } catch (error) {
    console.error("Talimat DELETE Error:", error);
    return NextResponse.json(
      { error: "Talimat silinemedi" },
      { status: 500 }
    );
  }
}
