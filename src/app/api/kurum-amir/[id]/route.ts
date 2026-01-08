import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const kurumAmirSchema = z.object({
  kurum_adi: z.string().min(1, "Kurum adı gerekli"),
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  unvan: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  gsm: z.string().optional(),
  sabit_tel: z.string().optional(),
  foto: z.string().optional(),
});

// GET - Tekil kurum amiri
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

    const amir = await prisma.kurum_amirleri.findUnique({
      where: { id },
    });

    if (!amir) {
      return NextResponse.json({ error: "Kurum amiri bulunamadı" }, { status: 404 });
    }

    const formattedAmir = {
      ...amir,
      created_at: amir.created_at ? dayjs(amir.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedAmir);
  } catch (error) {
    console.error("Kurum Amir GET Error:", error);
    return NextResponse.json(
      { error: "Kurum amiri getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Kurum amiri güncelle
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
    const validated = kurumAmirSchema.parse(body);

    await prisma.kurum_amirleri.update({
      where: { id },
      data: {
        kurum_adi: validated.kurum_adi,
        ad_soyad: validated.ad_soyad,
        unvan: validated.unvan || null,
        email: validated.email || null,
        gsm: validated.gsm || null,
        sabit_tel: validated.sabit_tel || null,
        foto: validated.foto || null,
      },
    });

    return NextResponse.json({
      message: "Kurum amiri başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Kurum Amir PUT Error:", error);
    return NextResponse.json(
      { error: "Kurum amiri güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Kurum amiri sil
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

    await prisma.kurum_amirleri.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Kurum amiri başarıyla silindi",
    });
  } catch (error) {
    console.error("Kurum Amir DELETE Error:", error);
    return NextResponse.json(
      { error: "Kurum amiri silinemedi" },
      { status: 500 }
    );
  }
}
