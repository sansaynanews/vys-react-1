import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const evrakUpdateSchema = z.object({
  gelen_kurum: z.string().optional(),
  tur: z.string().optional(),
  konu: z.string().min(1).optional(),
  notlar: z.string().optional(),
  evrak_tarih: z.string().optional(), // YYYY-MM-DD
  evrak_sayi: z.string().optional(),
  gelis_tarih: z.string().optional(), // YYYY-MM-DD
  teslim_alan: z.string().optional(),
  sunus_tarihi: z.string().optional().or(z.literal("")).nullable(),
  cikis_tarihi: z.string().optional().or(z.literal("")).nullable(),
});

// GET
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
    const item = await prisma.evraklar.findUnique({ where: { id: parseInt(paramId) } });
    if (!item) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json({ data: item });
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

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
    const validated = evrakUpdateSchema.parse(body);

    const data: any = { ...validated };
    if (data.evrak_tarih) data.evrak_tarih = new Date(data.evrak_tarih);
    if (data.gelis_tarih) data.gelis_tarih = new Date(data.gelis_tarih);

    // Allow clearing dates by sending null/empty string
    if (data.sunus_tarihi === "") data.sunus_tarihi = null;
    else if (data.sunus_tarihi) data.sunus_tarihi = new Date(data.sunus_tarihi);

    if (data.cikis_tarihi === "") data.cikis_tarihi = null;
    else if (data.cikis_tarihi) data.cikis_tarihi = new Date(data.cikis_tarihi);

    const updated = await prisma.evraklar.update({
      where: { id: parseInt(paramId) },
      data,
    });

    return NextResponse.json({
      message: "Güncellendi",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Güncelleme başarısız" },
      { status: 500 }
    );
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
    await prisma.evraklar.delete({ where: { id: parseInt(paramId) } });
    return NextResponse.json({ message: "Silindi" });
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
