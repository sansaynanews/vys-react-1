import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const sehitGaziBilgiSchema = z.object({
  tur: z.string().optional(),
  ad_soyad: z.string().optional(),
  kurum: z.string().optional(),
  medeni: z.string().optional(),
  es_ad: z.string().optional(),
  anne_ad: z.string().optional(),
  baba_ad: z.string().optional(),
  cocuk_sayisi: z.number().optional(),
  cocuk_adlari: z.string().optional(),
  olay_yeri: z.string().optional(),
  olay_tarih: z.string().optional(),
  foto: z.string().optional(),
});

// GET - Şehit/Gazi bilgi listesi
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const tur = searchParams.get("tur") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { kurum: { contains: search } },
        { olay_yeri: { contains: search } },
      ];
    }

    if (tur) {
      where.tur = tur;
    }

    const [kayitlar, total] = await Promise.all([
      prisma.sehit_gazi_bilgi.findMany({
        where,
        orderBy: [
          { ad_soyad: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.sehit_gazi_bilgi.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedKayitlar = kayitlar.map((kayit: any) => ({
      ...kayit,
      olay_tarih: kayit.olay_tarih ? dayjs(kayit.olay_tarih).format("YYYY-MM-DD") : null,
      created_at: kayit.created_at ? dayjs(kayit.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedKayitlar,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Sehit Gazi Bilgi GET Error:", error);
    return NextResponse.json(
      { error: "Şehit/Gazi bilgileri getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni şehit/gazi bilgi
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = sehitGaziBilgiSchema.parse(body);

    await prisma.sehit_gazi_bilgi.create({
      data: {
        tur: validated.tur || null,
        ad_soyad: validated.ad_soyad || null,
        kurum: validated.kurum || null,
        medeni: validated.medeni || null,
        es_ad: validated.es_ad || null,
        anne_ad: validated.anne_ad || null,
        baba_ad: validated.baba_ad || null,
        cocuk_sayisi: validated.cocuk_sayisi || null,
        cocuk_adlari: validated.cocuk_adlari || null,
        olay_yeri: validated.olay_yeri || null,
        olay_tarih: validated.olay_tarih ? new Date(validated.olay_tarih) : null,
        foto: validated.foto || null,
      },
    });

    return NextResponse.json({
      message: "Şehit/Gazi bilgisi başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sehit Gazi Bilgi POST Error:", error);
    return NextResponse.json(
      { error: "Şehit/Gazi bilgisi eklenemedi" },
      { status: 500 }
    );
  }
}
