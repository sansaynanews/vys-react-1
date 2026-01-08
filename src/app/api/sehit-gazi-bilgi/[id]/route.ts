import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bilgiUpdateSchema = z.object({
  tur: z.string().optional(),
  ad_soyad: z.string().optional(),
  kurum: z.string().optional(),
  medeni: z.string().optional(),
  es_ad: z.string().optional(),
  anne_ad: z.string().optional(),
  baba_ad: z.string().optional(),
  cocuk_sayisi: z.any().optional(),
  cocuk_adlari: z.string().optional(),
  olay_yeri: z.string().optional(),
  olay_tarih: z.string().optional(),
  foto: z.string().optional(),
});

// PUT
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
    const body = await request.json();
    const validated = bilgiUpdateSchema.parse(body);

    const data: any = { ...validated };
    if (data.olay_tarih) data.olay_tarih = new Date(data.olay_tarih);
    if (data.cocuk_sayisi) data.cocuk_sayisi = parseInt(data.cocuk_sayisi);

    const item = await prisma.sehit_gazi_bilgi.update({
      where: { id: parseInt(paramId) },
      data,
    });

    return NextResponse.json({ message: "Güncellendi", data: item });
  } catch (error) {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

// DELETE
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
    await prisma.sehit_gazi_bilgi.delete({ where: { id: parseInt(paramId) } });
    return NextResponse.json({ message: "Silindi" });
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
