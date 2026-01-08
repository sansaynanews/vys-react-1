import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const gecmisUpdateSchema = z.object({
  islem_turu: z.string().min(1, "İşlem türü gerekli"),
  tarih: z.string().optional(),
  km: z.number().optional(),
  aciklama: z.string().optional(),
});

// PUT - Geçmiş kaydı güncelleme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gecmisId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { gecmisId: paramId } = await params;
    const id = parseInt(paramId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = gecmisUpdateSchema.parse(body);

    // Kaydın var olduğunu kontrol et
    const existing = await prisma.arac_gecmis.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    const gecmis = await prisma.arac_gecmis.update({
      where: { id },
      data: {
        islem_turu: validated.islem_turu,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        km: validated.km || null,
        aciklama: validated.aciklama || null,
      },
    });

    return NextResponse.json({
      message: "Geçmiş kaydı başarıyla güncellendi",
      data: gecmis,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Araç Geçmiş PUT Error:", error);
    return NextResponse.json(
      { error: "Geçmiş kaydı güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Geçmiş kaydı silme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gecmisId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { gecmisId: paramId } = await params;
    const id = parseInt(paramId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    // Kaydın var olduğunu kontrol et
    const existing = await prisma.arac_gecmis.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    await prisma.arac_gecmis.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Geçmiş kaydı başarıyla silindi",
    });
  } catch (error) {
    console.error("Araç Geçmiş DELETE Error:", error);
    return NextResponse.json(
      { error: "Geçmiş kaydı silinemedi" },
      { status: 500 }
    );
  }
}
