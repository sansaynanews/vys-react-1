import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const vipUpdateSchema = z.object({
  protokol_turu: z.string().optional(),
  ad_soyad: z.string().min(1).optional(),
  gelis_tarihi: z.string().optional(),
  gelis_saati: z.string().optional(),
  karsilama_yeri: z.string().optional(),
  konaklama_yeri: z.string().optional(),
  notlar: z.string().optional(),
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
    const validated = vipUpdateSchema.parse(body);

    const data: any = { ...validated };
    if (data.gelis_tarihi) data.gelis_tarihi = new Date(data.gelis_tarihi);

    const item = await prisma.ust_duzey_ziyaret.update({
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
    await prisma.ust_duzey_ziyaret.delete({ where: { id: parseInt(paramId) } });
    return NextResponse.json({ message: "Silindi" });
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
