import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const kamuZiyaretSchema = z.object({
  kurum: z.string().optional(),
  yer: z.string().optional(),
  tarih: z.string().optional(),
  saat: z.string().optional(),
  talepler: z.string().optional(),
});

// GET - Tekil kamu ziyaret
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

    const ziyaret = await prisma.ziyaret_kamu.findUnique({
      where: { id },
    });

    if (!ziyaret) {
      return NextResponse.json({ error: "Ziyaret bulunamadı" }, { status: 404 });
    }

    const formattedZiyaret = {
      ...ziyaret,
      tarih: ziyaret.tarih ? dayjs(ziyaret.tarih).format("YYYY-MM-DD") : null,
      created_at: ziyaret.created_at ? dayjs(ziyaret.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedZiyaret);
  } catch (error) {
    console.error("Kamu Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "Ziyaret getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Kamu ziyaret güncelle
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
    const validated = kamuZiyaretSchema.parse(body);

    await prisma.ziyaret_kamu.update({
      where: { id },
      data: {
        kurum: validated.kurum || null,
        yer: validated.yer || null,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        saat: validated.saat || null,
        talepler: validated.talepler || null,
      },
    });

    return NextResponse.json({
      message: "Kamu ziyareti başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Kamu Ziyaret PUT Error:", error);
    return NextResponse.json(
      { error: "Kamu ziyareti güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Kamu ziyaret sil
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

    await prisma.ziyaret_kamu.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Kamu ziyareti başarıyla silindi",
    });
  } catch (error) {
    console.error("Kamu Ziyaret DELETE Error:", error);
    return NextResponse.json(
      { error: "Kamu ziyareti silinemedi" },
      { status: 500 }
    );
  }
}
