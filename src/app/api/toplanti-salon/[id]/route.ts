import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const salonUpdateSchema = z.object({
  ad: z.string().min(1, "Salon adı gerekli"),
  kapasite: z.number().optional(),
  konum: z.string().optional(),
  ekipman: z.string().optional(),
  notlar: z.string().optional(),
});

// GET - Tek salon
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

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const salon = await prisma.toplanti_salonlari.findUnique({
      where: { id },
    });

    if (!salon) {
      return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ data: salon });
  } catch (error) {
    console.error("Salon GET Error:", error);
    return NextResponse.json(
      { error: "Salon getirilemedi" },
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

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = salonUpdateSchema.parse(body);

    // Salon var mı kontrol et
    const existing = await prisma.toplanti_salonlari.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
    }

    // Salon adı değiştiriliyorsa başka salon kullanıyor mu kontrol et
    if (validated.ad !== existing.ad) {
      const adExists = await prisma.toplanti_salonlari.findFirst({
        where: {
          ad: validated.ad,
          id: { not: id },
        },
      });

      if (adExists) {
        return NextResponse.json(
          { error: "Bu isimde başka bir salon mevcut" },
          { status: 400 }
        );
      }
    }

    const salon = await prisma.toplanti_salonlari.update({
      where: { id },
      data: {
        ad: validated.ad,
        kapasite: validated.kapasite || null,
        konum: validated.konum || null,
        ekipman: validated.ekipman || null,
        notlar: validated.notlar || null,
      },
    });

    return NextResponse.json({
      message: "Salon başarıyla güncellendi",
      data: salon,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Salon PUT Error:", error);
    return NextResponse.json(
      { error: "Salon güncellenemedi" },
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

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    // Salon var mı kontrol et
    const existing = await prisma.toplanti_salonlari.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
    }

    // Salonu sil
    await prisma.toplanti_salonlari.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Salon başarıyla silindi",
    });
  } catch (error) {
    console.error("Salon DELETE Error:", error);
    return NextResponse.json(
      { error: "Salon silinemedi" },
      { status: 500 }
    );
  }
}
