import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const randevuUpdateSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli").optional(),
  kurum: z.string().min(1, "Kurum gerekli").optional(),
  unvan: z.string().optional(),
  iletisim: z.string().optional(),
  amac: z.string().optional(),
  tarih: z.string().optional(),
  saat: z.string().optional(),
  durum: z.string().optional(),
  notlar: z.string().optional(),
});

// GET - Tekil randevu
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
    const randevu = await prisma.randevular.findUnique({
      where: { id },
    });

    if (!randevu) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...randevu,
        tarih: randevu.tarih ? dayjs(randevu.tarih).format("YYYY-MM-DD") : null,
      },
    });
  } catch (error) {
    console.error("Randevu GET Error:", error);
    return NextResponse.json(
      { error: "Randevu getirilemedi" },
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
    const validated = randevuUpdateSchema.parse(body);

    // Mevcut kontrolü
    const existing = await prisma.randevular.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    // Tarih çakışma kontrolü (eğer tarih/saat değişiyorsa)
    if (validated.tarih && validated.saat) {
      const conflict = await prisma.randevular.findFirst({
        where: {
          id: { not: id },
          tarih: new Date(validated.tarih),
          saat: validated.saat,
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "Bu tarih ve saatte başka bir randevu var" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validated.ad_soyad) updateData.ad_soyad = validated.ad_soyad;
    if (validated.kurum) updateData.kurum = validated.kurum;
    if (validated.unvan !== undefined) updateData.unvan = validated.unvan;
    if (validated.iletisim !== undefined) updateData.iletisim = validated.iletisim;
    if (validated.amac !== undefined) updateData.amac = validated.amac;
    if (validated.tarih) updateData.tarih = new Date(validated.tarih);
    if (validated.saat) updateData.saat = validated.saat;
    if (validated.durum) updateData.durum = validated.durum;
    if (validated.notlar !== undefined) updateData.notlar = validated.notlar;

    const randevu = await prisma.randevular.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Randevu başarıyla güncellendi",
      data: {
        ...randevu,
        tarih: randevu.tarih ? dayjs(randevu.tarih).format("YYYY-MM-DD") : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Randevu PUT Error:", error);
    return NextResponse.json(
      { error: "Randevu güncellenemedi" },
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

    const existing = await prisma.randevular.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.randevular.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Randevu başarıyla silindi",
    });
  } catch (error) {
    console.error("Randevu DELETE Error:", error);
    return NextResponse.json(
      { error: "Randevu silinemedi" },
      { status: 500 }
    );
  }
}
