import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const etkinlikSchema = z.object({
  adi: z.string().optional(),
  kurum: z.string().optional(),
  tarih: z.string().optional(),
  orijinal_tarih: z.string().optional(),
  saat: z.string().optional(),
  yer: z.string().optional(),
  detay: z.string().optional(),
  tekrar_yillik: z.boolean().optional(),
});

// GET - Tekil etkinlik
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

    const etkinlik = await prisma.etkinlikler.findUnique({
      where: { id },
    });

    if (!etkinlik) {
      return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });
    }

    const formattedEtkinlik = {
      ...etkinlik,
      tarih: etkinlik.tarih ? dayjs(etkinlik.tarih).format("YYYY-MM-DD") : null,
      orijinal_tarih: etkinlik.orijinal_tarih ? dayjs(etkinlik.orijinal_tarih).format("YYYY-MM-DD") : null,
      created_at: etkinlik.created_at ? dayjs(etkinlik.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedEtkinlik);
  } catch (error) {
    console.error("Etkinlik GET Error:", error);
    return NextResponse.json(
      { error: "Etkinlik getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Etkinlik güncelle
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
    const validated = etkinlikSchema.parse(body);

    await prisma.etkinlikler.update({
      where: { id },
      data: {
        adi: validated.adi || null,
        kurum: validated.kurum || null,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        orijinal_tarih: validated.orijinal_tarih ? new Date(validated.orijinal_tarih) : null,
        saat: validated.saat || null,
        yer: validated.yer || null,
        detay: validated.detay || null,
        tekrar_yillik: validated.tekrar_yillik || false,
      },
    });

    return NextResponse.json({
      message: "Etkinlik başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Etkinlik PUT Error:", error);
    return NextResponse.json(
      { error: "Etkinlik güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Etkinlik sil
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

    await prisma.etkinlikler.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Etkinlik başarıyla silindi",
    });
  } catch (error) {
    console.error("Etkinlik DELETE Error:", error);
    return NextResponse.json(
      { error: "Etkinlik silinemedi" },
      { status: 500 }
    );
  }
}
