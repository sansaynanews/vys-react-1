import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const projeSchema = z.object({
  konu: z.string().min(1, "Konu gerekli"),
  sahibi: z.string().min(1, "Proje sahibi gerekli"),
  kurum: z.string().optional(),
  iletisim: z.string().optional(),
  baslangic: z.string().optional(),
  bitis: z.string().optional(),
  durum: z.string().optional(),
  hedefler: z.string().optional(),
});

// GET - Tekil proje
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

    const proje = await prisma.projeler.findUnique({
      where: { id },
    });

    if (!proje) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }

    const formattedProje = {
      ...proje,
      baslangic: proje.baslangic ? dayjs(proje.baslangic).format("YYYY-MM-DD") : null,
      bitis: proje.bitis ? dayjs(proje.bitis).format("YYYY-MM-DD") : null,
      created_at: proje.created_at ? dayjs(proje.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedProje);
  } catch (error) {
    console.error("Proje GET Error:", error);
    return NextResponse.json(
      { error: "Proje getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Proje güncelle
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
    const validated = projeSchema.parse(body);

    await prisma.projeler.update({
      where: { id },
      data: {
        konu: validated.konu,
        sahibi: validated.sahibi,
        kurum: validated.kurum || null,
        iletisim: validated.iletisim || null,
        baslangic: validated.baslangic ? new Date(validated.baslangic) : null,
        bitis: validated.bitis ? new Date(validated.bitis) : null,
        durum: validated.durum || "Beklemede",
        hedefler: validated.hedefler || null,
      },
    });

    return NextResponse.json({
      message: "Proje başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Proje PUT Error:", error);
    return NextResponse.json(
      { error: "Proje güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Proje sil
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

    await prisma.projeler.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Proje başarıyla silindi",
    });
  } catch (error) {
    console.error("Proje DELETE Error:", error);
    return NextResponse.json(
      { error: "Proje silinemedi" },
      { status: 500 }
    );
  }
}
