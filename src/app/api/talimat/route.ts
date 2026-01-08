import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const talimatSchema = z.object({
  konu: z.string().min(1, "Konu gerekli"),
  verilen_kisi: z.string().min(1, "Talimati veren kişi gerekli"),
  kurum: z.string().optional(),
  iletisim: z.string().optional(),
  tarih: z.string().optional(),
  durum: z.string().optional(),
  icerik: z.string().optional(),
  onem_derecesi: z.string().optional(),
  saat: z.string().optional(),
  tamamlanma_tarihi: z.string().optional().nullable(),
  tamamlayan_kisi: z.string().optional().nullable(),
});

// GET - Talimat listesi
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
    const durum = searchParams.get("durum") || "";
    const onem_derecesi = searchParams.get("onem_derecesi") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { konu: { contains: search } },
        { verilen_kisi: { contains: search } },
        { kurum: { contains: search } },
        { icerik: { contains: search } },
      ];
    }

    if (durum) {
      where.durum = durum;
    }

    if (onem_derecesi) {
      where.onem_derecesi = onem_derecesi;
    }

    const [talimatlar, total] = await Promise.all([
      prisma.talimatlar.findMany({
        where,
        orderBy: [
          { tarih: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.talimatlar.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedTalimatlar = talimatlar.map((talimat: any) => ({
      ...talimat,
      tarih: talimat.tarih ? dayjs(talimat.tarih).format("YYYY-MM-DD") : null,
      tamamlanma_tarihi: talimat.tamamlanma_tarihi ? dayjs(talimat.tamamlanma_tarihi).format("YYYY-MM-DD") : null,
      created_at: talimat.created_at ? dayjs(talimat.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedTalimatlar,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Talimat GET Error:", error);
    return NextResponse.json(
      { error: "Talimatlar getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni talimat
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = talimatSchema.parse(body);

    await prisma.talimatlar.create({
      data: {
        konu: validated.konu,
        verilen_kisi: validated.verilen_kisi,
        kurum: validated.kurum || null,
        iletisim: validated.iletisim || null,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        durum: validated.durum || "Beklemede",
        icerik: validated.icerik || null,
        onem_derecesi: validated.onem_derecesi || "Normal",
        saat: validated.saat ? new Date(`1970-01-01T${validated.saat}`) : null,
        tamamlanma_tarihi: validated.tamamlanma_tarihi ? new Date(validated.tamamlanma_tarihi) : null,
        tamamlayan_kisi: validated.tamamlayan_kisi || null,
      },
    });

    return NextResponse.json({
      message: "Talimat başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Talimat POST Error:", error);
    return NextResponse.json(
      { error: "Talimat eklenemedi" },
      { status: 500 }
    );
  }
}
