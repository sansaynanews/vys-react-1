import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const evrakSchema = z.object({
  gelen_kurum: z.string().min(1, "Gelen kurum gerekli"),
  tur: z.string().min(1, "Evrak türü gerekli"),
  konu: z.string().min(1, "Konu gerekli"),
  notlar: z.string().optional(),
  evrak_tarih: z.string().optional(),
  evrak_sayi: z.string().optional(),
  gelis_tarih: z.string().optional(),
  teslim_alan: z.string().optional(),
  cikis_tarihi: z.string().optional().nullable(),
  sunus_tarihi: z.string().optional().nullable(),
  saat: z.string().optional(),
});

// GET - Tekil evrak
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

    const evrak = await prisma.evraklar.findUnique({
      where: { id },
    });

    if (!evrak) {
      return NextResponse.json({ error: "Evrak bulunamadı" }, { status: 404 });
    }

    // Tarihleri formatla
    const formattedEvrak = {
      ...evrak,
      evrak_tarih: evrak.evrak_tarih ? dayjs(evrak.evrak_tarih).format("YYYY-MM-DD") : null,
      gelis_tarih: evrak.gelis_tarih ? dayjs(evrak.gelis_tarih).format("YYYY-MM-DD") : null,
      cikis_tarihi: evrak.cikis_tarihi ? dayjs(evrak.cikis_tarihi).format("YYYY-MM-DD") : null,
      sunus_tarihi: evrak.sunus_tarihi ? dayjs(evrak.sunus_tarihi).format("YYYY-MM-DD") : null,
      created_at: evrak.created_at ? dayjs(evrak.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedEvrak);
  } catch (error) {
    console.error("Evrak GET Error:", error);
    return NextResponse.json(
      { error: "Evrak getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Evrak güncelle
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
    const validated = evrakSchema.parse(body);

    await prisma.evraklar.update({
      where: { id },
      data: {
        gelen_kurum: validated.gelen_kurum,
        tur: validated.tur,
        konu: validated.konu,
        notlar: validated.notlar || null,
        evrak_tarih: validated.evrak_tarih ? new Date(validated.evrak_tarih) : null,
        evrak_sayi: validated.evrak_sayi || null,
        gelis_tarih: validated.gelis_tarih ? new Date(validated.gelis_tarih) : null,
        teslim_alan: validated.teslim_alan || null,
        cikis_tarihi: validated.cikis_tarihi ? new Date(validated.cikis_tarihi) : null,
        sunus_tarihi: validated.sunus_tarihi ? new Date(validated.sunus_tarihi) : null,
        saat: validated.saat ? new Date(`1970-01-01T${validated.saat}`) : null,
      },
    });

    return NextResponse.json({
      message: "Evrak başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Evrak PUT Error:", error);
    return NextResponse.json(
      { error: "Evrak güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Evrak sil
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

    await prisma.evraklar.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Evrak başarıyla silindi",
    });
  } catch (error) {
    console.error("Evrak DELETE Error:", error);
    return NextResponse.json(
      { error: "Evrak silinemedi" },
      { status: 500 }
    );
  }
}
