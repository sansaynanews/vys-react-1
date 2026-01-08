import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const ustDuzeyZiyaretSchema = z.object({
  protokol_turu: z.string().optional(),
  ad_soyad: z.string().optional(),
  gelis_tarihi: z.string().optional(),
  gelis_saati: z.string().optional(),
  karsilama_yeri: z.string().optional(),
  konaklama_yeri: z.string().optional(),
  notlar: z.string().optional(),
});

// GET - Üst düzey ziyaret listesi
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
    const tarih = searchParams.get("tarih") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { protokol_turu: { contains: search } },
        { karsilama_yeri: { contains: search } },
      ];
    }

    if (tarih) {
      where.gelis_tarihi = new Date(tarih);
    }

    const [ziyaretler, total] = await Promise.all([
      prisma.ust_duzey_ziyaret.findMany({
        where,
        orderBy: [
          { gelis_tarihi: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.ust_duzey_ziyaret.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedZiyaretler = ziyaretler.map((ziyaret: any) => ({
      ...ziyaret,
      gelis_tarihi: ziyaret.gelis_tarihi ? dayjs(ziyaret.gelis_tarihi).format("YYYY-MM-DD") : null,
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
    console.error("Ust Duzey Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "Üst düzey ziyaretler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni üst düzey ziyaret
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = ustDuzeyZiyaretSchema.parse(body);

    await prisma.ust_duzey_ziyaret.create({
      data: {
        protokol_turu: validated.protokol_turu || null,
        ad_soyad: validated.ad_soyad || null,
        gelis_tarihi: validated.gelis_tarihi ? new Date(validated.gelis_tarihi) : null,
        gelis_saati: validated.gelis_saati || null,
        karsilama_yeri: validated.karsilama_yeri || null,
        konaklama_yeri: validated.konaklama_yeri || null,
        notlar: validated.notlar || null,
      },
    });

    return NextResponse.json({
      message: "Üst düzey ziyaret başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Ust Duzey Ziyaret POST Error:", error);
    return NextResponse.json(
      { error: "Üst düzey ziyaret eklenemedi" },
      { status: 500 }
    );
  }
}
