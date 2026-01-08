import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const protokolUpdateSchema = z.object({
  sira_no: z.preprocess((val) => Number(val), z.number().optional()),
  ad_soyad: z.string().min(1).optional(),
  unvan: z.string().optional(),
  kurum: z.string().optional(),
  telefon: z.string().optional(),
  eposta: z.string().email().optional().or(z.literal("")),
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
    const validated = protokolUpdateSchema.parse(body);

    const item = await prisma.protokol_listesi.update({
      where: { id: parseInt(paramId) },
      data: validated,
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
    await prisma.protokol_listesi.delete({ where: { id: parseInt(paramId) } });
    return NextResponse.json({ message: "Silindi" });
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
