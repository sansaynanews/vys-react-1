import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const ziyaretciKayitSchema = z.object({
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

// GET - Tekil ziyaretçi kaydı
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

    const kayit = await prisma.ziyaretci_kayitlari.findUnique({
      where: { id },
    });

    if (!kayit) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    const formattedKayit = {
      ...kayit,
      giris_tarihi: kayit.giris_tarihi ? dayjs(kayit.giris_tarihi).format("YYYY-MM-DD") : null,
      created_at: kayit.created_at ? dayjs(kayit.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedKayit);
  } catch (error) {
    console.error("Ziyaretci Kayit GET Error:", error);
    return NextResponse.json(
      { error: "Kayıt getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Ziyaretçi kaydı güncelle
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
    const validated = ziyaretciKayitSchema.parse(body);

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

    console.error("Ziyaretci Kayit PUT Error:", error);
    return NextResponse.json(
      { error: "Kayıt güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Ziyaretçi kaydı sil
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
    console.error("Ziyaretci Kayit DELETE Error:", error);
    return NextResponse.json(
      { error: "Kayıt silinemedi" },
      { status: 500 }
    );
  }
}
