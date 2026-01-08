import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const izinSchema = z.object({
  kurum_adi: z.string().optional(),
  amir_ad: z.string().min(1, "Amir adı gerekli"),
  baslangic: z.string().min(1, "Başlangıç tarihi gerekli"),
  bitis: z.string().min(1, "Bitiş tarihi gerekli"),
  vekil_ad: z.string().optional(),
  vekil_unvan: z.string().optional(),
  vekil_tel: z.string().optional(),
  izin_turu: z.string().optional(),
});

// GET - Tekil izin
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

    const izin = await prisma.amir_izinleri.findUnique({
      where: { id },
    });

    if (!izin) {
      return NextResponse.json({ error: "İzin kaydı bulunamadı" }, { status: 404 });
    }

    const formattedIzin = {
      ...izin,
      baslangic: izin.baslangic ? dayjs(izin.baslangic).format("YYYY-MM-DD") : null,
      bitis: izin.bitis ? dayjs(izin.bitis).format("YYYY-MM-DD") : null,
      created_at: izin.created_at ? dayjs(izin.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedIzin);
  } catch (error) {
    console.error("Amir İzin GET Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - İzin güncelle
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
    const validated = izinSchema.parse(body);

    // Tarih kontrolü
    const baslangic = dayjs(validated.baslangic);
    const bitis = dayjs(validated.bitis);

    if (bitis.isBefore(baslangic)) {
      return NextResponse.json(
        { error: "Bitiş tarihi başlangıç tarihinden önce olamaz" },
        { status: 400 }
      );
    }

    await prisma.amir_izinleri.update({
      where: { id },
      data: {
        kurum_adi: validated.kurum_adi || null,
        amir_ad: validated.amir_ad,
        baslangic: new Date(validated.baslangic),
        bitis: new Date(validated.bitis),
        vekil_ad: validated.vekil_ad || null,
        vekil_unvan: validated.vekil_unvan || null,
        vekil_tel: validated.vekil_tel || null,
        izin_turu: validated.izin_turu || "Yıllık İzin",
      },
    });

    return NextResponse.json({
      message: "İzin kaydı başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Amir İzin PUT Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - İzin sil
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

    await prisma.amir_izinleri.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "İzin kaydı başarıyla silindi",
    });
  } catch (error) {
    console.error("Amir İzin DELETE Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı silinemedi" },
      { status: 500 }
    );
  }
}
