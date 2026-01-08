import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const ziyaretSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  unvan: z.string().optional(),
  kurum: z.string().optional(),
  iletisim: z.string().optional(),
  giris_tarihi: z.string().min(1, "Giriş tarihi gerekli"),
  giris_saati: z.string().min(1, "Giriş saati gerekli"),
  cikis_saati: z.string().optional(),
  kisi_sayisi: z.number().optional(),
  diger_kisiler: z.string().optional(),
});

// GET - Tekil ziyaretçi
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

    const ziyaret = await prisma.ziyaretci_kayitlari.findUnique({
      where: { id },
    });

    if (!ziyaret) {
      return NextResponse.json({ error: "Ziyaretçi bulunamadı" }, { status: 404 });
    }

    const formattedZiyaret = {
      ...ziyaret,
      giris_tarihi: ziyaret.giris_tarihi ? dayjs(ziyaret.giris_tarihi).format("YYYY-MM-DD") : null,
      created_at: ziyaret.created_at ? dayjs(ziyaret.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedZiyaret);
  } catch (error) {
    console.error("Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "Ziyaretçi getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Ziyaretçi güncelle
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
    const validated = ziyaretSchema.parse(body);

    await prisma.ziyaretci_kayitlari.update({
      where: { id },
      data: {
        ad_soyad: validated.ad_soyad,
        unvan: validated.unvan || null,
        kurum: validated.kurum || null,
        iletisim: validated.iletisim || null,
        giris_tarihi: new Date(validated.giris_tarihi),
        giris_saati: validated.giris_saati,
        cikis_saati: validated.cikis_saati || null,
        kisi_sayisi: validated.kisi_sayisi || 1,
        diger_kisiler: validated.diger_kisiler || null,
      },
    });

    return NextResponse.json({
      message: "Ziyaretçi kaydı başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Ziyaret PUT Error:", error);
    return NextResponse.json(
      { error: "Ziyaretçi kaydı güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Ziyaretçi sil
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

    await prisma.ziyaretci_kayitlari.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Ziyaretçi kaydı başarıyla silindi",
    });
  } catch (error) {
    console.error("Ziyaret DELETE Error:", error);
    return NextResponse.json(
      { error: "Ziyaretçi kaydı silinemedi" },
      { status: 500 }
    );
  }
}
