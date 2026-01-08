import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation Schema
const aracSchema = z.object({
  plaka: z.string().min(1, "Plaka gerekli"),
  marka: z.string().min(1, "Marka gerekli"),
  model: z.string().optional(),
  model_yili: z.number().optional(),
  ruhsat_seri: z.string().optional(),
  lastik_ebat: z.string().optional(),
  renk: z.string().optional(),
  tur: z.string().optional(),
  yakit: z.string().optional(),
  kurum: z.string().optional(),
  bakim_son: z.string().optional(),
  bakim_sonraki: z.string().optional(),
  sigorta_bas: z.string().optional(),
  sigorta_bit: z.string().optional(),
  kasko_bas: z.string().optional(),
  kasko_bit: z.string().optional(),
  muayene_tarih: z.string().optional(),
  muayene_bit: z.string().optional(),
  bakim_son_km: z.number().optional(),
  bakim_sonraki_km: z.number().optional(),
  lastik_degisim_tarih: z.string().optional(),
  lastik_yili: z.string().optional(),
  periyodik_bakim_tarih: z.string().optional(),
  periyodik_bakim_km: z.number().optional(),
  agir_bakim_tarih: z.string().optional(),
  agir_bakim_km: z.number().optional(),
  diger_aciklama: z.string().optional(),
});

// GET - Araç Listesi
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
    const kurum = searchParams.get("kurum") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { plaka: { contains: search } },
        { marka: { contains: search } },
        { model: { contains: search } },
      ];
    }

    if (kurum) {
      where.kurum = { contains: kurum };
    }

    const [araclar, total] = await Promise.all([
      prisma.araclar.findMany({
        where,
        orderBy: { plaka: "asc" },
        skip,
        take: limit,
      }),
      prisma.araclar.count({ where }),
    ]);

    return NextResponse.json({
      data: araclar.map((arac: any) => ({
        ...arac,
        muayene_bit: arac.muayene_bit ? dayjs(arac.muayene_bit).format("YYYY-MM-DD") : null,
        sigorta_bit: arac.sigorta_bit ? dayjs(arac.sigorta_bit).format("YYYY-MM-DD") : null,
        kasko_bit: arac.kasko_bit ? dayjs(arac.kasko_bit).format("YYYY-MM-DD") : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Araçlar GET Error:", error);
    return NextResponse.json(
      { error: "Araç listesi getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni Araç
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = aracSchema.parse(body);

    // Plaka kontrolü
    const existing = await prisma.araclar.findFirst({
      where: { plaka: validated.plaka },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu plaka ile kayıtlı araç mevcut" },
        { status: 400 }
      );
    }

    // Tarih alanlarını dönüştürme
    const dateFields = [
      "bakim_son", "sigorta_bas", "sigorta_bit", "kasko_bas", "kasko_bit",
      "muayene_tarih", "muayene_bit", "lastik_degisim_tarih",
      "periyodik_bakim_tarih", "agir_bakim_tarih"
    ];

    const data: any = { ...validated };

    dateFields.forEach(field => {
      if (data[field]) {
        data[field] = new Date(data[field]);
      }
    });

    const arac = await prisma.araclar.create({
      data,
    });

    return NextResponse.json({
      message: "Araç başarıyla kaydedildi",
      data: arac,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Araç POST Error:", error);
    return NextResponse.json(
      { error: "Araç kaydedilemedi" },
      { status: 500 }
    );
  }
}
