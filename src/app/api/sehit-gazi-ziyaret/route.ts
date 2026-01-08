import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const sehitGaziZiyaretSchema = z.object({
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
  ziyaret_tarih: z.string().optional(),
  ziyaret_saat: z.string().optional(),
  talepler: z.string().optional(),
  aile_ferdi: z.string().optional(),
  saat: z.string().optional(),
});

// GET - Şehit/Gazi ziyaret listesi
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
    const tarih = searchParams.get("tarih") || "";

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

    if (tarih) {
      where.ziyaret_tarih = new Date(tarih);
    }

    const [ziyaretler, total] = await Promise.all([
      prisma.ziyaret_sehit_gazi.findMany({
        where,
        orderBy: [
          { ziyaret_tarih: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.ziyaret_sehit_gazi.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedZiyaretler = ziyaretler.map((ziyaret: any) => ({
      ...ziyaret,
      olay_tarih: ziyaret.olay_tarih ? dayjs(ziyaret.olay_tarih).format("YYYY-MM-DD") : null,
      ziyaret_tarih: ziyaret.ziyaret_tarih ? dayjs(ziyaret.ziyaret_tarih).format("YYYY-MM-DD") : null,
      created_at: ziyaret.created_at ? dayjs(ziyaret.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedZiyaretler,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Sehit Gazi Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "Ziyaretler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni şehit/gazi ziyaret
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = sehitGaziZiyaretSchema.parse(body);

    await prisma.ziyaret_sehit_gazi.create({
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
        ziyaret_tarih: validated.ziyaret_tarih ? new Date(validated.ziyaret_tarih) : null,
        ziyaret_saat: validated.ziyaret_saat || null,
        talepler: validated.talepler || null,
        aile_ferdi: validated.aile_ferdi || null,
        saat: validated.saat || null,
      },
    });

    return NextResponse.json({
      message: "Ziyaret kaydı başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sehit Gazi Ziyaret POST Error:", error);
    return NextResponse.json(
      { error: "Ziyaret kaydı eklenemedi" },
      { status: 500 }
    );
  }
}
