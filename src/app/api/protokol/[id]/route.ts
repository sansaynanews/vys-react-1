import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const protokolSchema = z.object({
  sira_no: z.number().optional(),
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  unvan: z.string().optional(),
  kurum: z.string().optional(),
  telefon: z.string().optional(),
  eposta: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
});

// GET - Tekil protokol
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

    const protokol = await prisma.protokol_listesi.findUnique({
      where: { id },
    });

    if (!protokol) {
      return NextResponse.json({ error: "Protokol kaydı bulunamadı" }, { status: 404 });
    }

    const formattedProtokol = {
      ...protokol,
      created_at: protokol.created_at ? dayjs(protokol.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedProtokol);
  } catch (error) {
    console.error("Protokol GET Error:", error);
    return NextResponse.json(
      { error: "Protokol kaydı getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Protokol güncelle
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
    const validated = protokolSchema.parse(body);

    await prisma.protokol_listesi.update({
      where: { id },
      data: {
        sira_no: validated.sira_no || null,
        ad_soyad: validated.ad_soyad,
        unvan: validated.unvan || null,
        kurum: validated.kurum || null,
        telefon: validated.telefon || null,
        eposta: validated.eposta || null,
      },
    });

    return NextResponse.json({
      message: "Protokol kaydı başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Protokol PUT Error:", error);
    return NextResponse.json(
      { error: "Protokol kaydı güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Protokol sil
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

    await prisma.protokol_listesi.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Protokol kaydı başarıyla silindi",
    });
  } catch (error) {
    console.error("Protokol DELETE Error:", error);
    return NextResponse.json(
      { error: "Protokol kaydı silinemedi" },
      { status: 500 }
    );
  }
}
