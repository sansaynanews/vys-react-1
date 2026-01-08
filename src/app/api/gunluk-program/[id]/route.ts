import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const gunlukProgramSchema = z.object({
  tarih: z.string().min(1, "Tarih gerekli"),
  saat: z.string().min(1, "Saat gerekli"),
  tur: z.string().optional(),
  aciklama: z.string().optional(),
});

// GET - Tekil günlük program
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

    const program = await prisma.gunluk_program_manuel.findUnique({
      where: { id },
    });

    if (!program) {
      return NextResponse.json({ error: "Günlük program bulunamadı" }, { status: 404 });
    }

    const formattedProgram = {
      ...program,
      tarih: program.tarih ? dayjs(program.tarih).format("YYYY-MM-DD") : null,
      created_at: program.created_at ? dayjs(program.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedProgram);
  } catch (error) {
    console.error("Gunluk Program GET Error:", error);
    return NextResponse.json(
      { error: "Günlük program getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Günlük program güncelle
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
    const validated = gunlukProgramSchema.parse(body);

    await prisma.gunluk_program_manuel.update({
      where: { id },
      data: {
        tarih: new Date(validated.tarih),
        saat: validated.saat,
        tur: validated.tur || null,
        aciklama: validated.aciklama || null,
      },
    });

    return NextResponse.json({
      message: "Günlük program başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Gunluk Program PUT Error:", error);
    return NextResponse.json(
      { error: "Günlük program güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Günlük program sil
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

    await prisma.gunluk_program_manuel.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Günlük program başarıyla silindi",
    });
  } catch (error) {
    console.error("Gunluk Program DELETE Error:", error);
    return NextResponse.json(
      { error: "Günlük program silinemedi" },
      { status: 500 }
    );
  }
}
