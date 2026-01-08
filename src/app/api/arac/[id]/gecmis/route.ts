import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const gecmisSchema = z.object({
  islem_turu: z.string().min(1, "İşlem türü gerekli"),
  tarih: z.string().optional(),
  km: z.number().optional(),
  aciklama: z.string().optional(),
});

// GET - Araç geçmişi listesi
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
    const aracId = parseInt(paramId);

    if (isNaN(aracId)) {
      return NextResponse.json({ error: "Geçersiz araç ID" }, { status: 400 });
    }

    // Aracın var olduğunu kontrol et
    const arac = await prisma.araclar.findUnique({
      where: { id: aracId },
    });

    if (!arac) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    // Geçmiş kayıtlarını getir
    const gecmis = await prisma.arac_gecmis.findMany({
      where: {
        arac_id: aracId,
      },
      orderBy: {
        tarih: "desc",
      },
    });

    // Tarihleri formatla
    const formattedGecmis = gecmis.map((kayit: any) => ({
      ...kayit,
      tarih: kayit.tarih ? dayjs(kayit.tarih).format("YYYY-MM-DD") : null,
      islem_tarihi: kayit.islem_tarihi ? dayjs(kayit.islem_tarihi).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedGecmis,
      arac: {
        id: arac.id,
        plaka: arac.plaka,
        marka: arac.marka,
        model: arac.model,
      },
    });
  } catch (error) {
    console.error("Araç Geçmiş GET Error:", error);
    return NextResponse.json(
      { error: "Geçmiş kayıtları getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni geçmiş kaydı
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: paramId } = await params;
    const aracId = parseInt(paramId);

    if (isNaN(aracId)) {
      return NextResponse.json({ error: "Geçersiz araç ID" }, { status: 400 });
    }

    // Aracın var olduğunu kontrol et
    const arac = await prisma.araclar.findUnique({
      where: { id: aracId },
    });

    if (!arac) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }

    const body = await request.json();
    const validated = gecmisSchema.parse(body);

    const gecmis = await prisma.arac_gecmis.create({
      data: {
        arac_id: aracId,
        islem_turu: validated.islem_turu,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        km: validated.km || null,
        aciklama: validated.aciklama || null,
        kullanici: session.user.name || "Sistem",
      },
    });

    return NextResponse.json({
      message: "Geçmiş kaydı başarıyla oluşturuldu",
      data: gecmis,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Araç Geçmiş POST Error:", error);
    return NextResponse.json(
      { error: "Geçmiş kaydı oluşturulamadı" },
      { status: 500 }
    );
  }
}
