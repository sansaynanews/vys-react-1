import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const stokUpdateSchema = z.object({
  adi: z.string().min(1).optional(),
  cesit: z.string().min(1).optional(),
  kategori: z.string().optional(),
  tur: z.string().optional(),
  // Miktar buradan güncellenmemeli, hareketlerle yönetilmeli.
  // Ancak admin düzeltmesi için izin verilebilir.
  miktar: z.preprocess((val) => Number(val), z.number().optional()),
});

// GET - Tekil
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

    const stok = await prisma.stok_kartlari.findUnique({
      where: { id },
    });

    if (!stok) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ data: stok });
  } catch (error) {
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
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
    const validated = stokUpdateSchema.parse(body);

    const updated = await prisma.stok_kartlari.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ message: "Güncellendi", data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
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

    // Hareket kontrolü yapmak iyi olurdu ancak şimdilik direkt siliyoruz
    await prisma.stok_kartlari.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Silindi" });
  } catch (error) {
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
