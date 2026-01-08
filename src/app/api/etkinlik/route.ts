import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const etkinlikSchema = z.object({
  adi: z.string().optional(),
  kurum: z.string().optional(),
  tarih: z.string().optional(),
  orijinal_tarih: z.string().optional(),
  saat: z.string().optional(),
  yer: z.string().optional(),
  detay: z.string().optional(),
  tekrar_yillik: z.boolean().optional(),
});

// GET - Etkinlik listesi
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
    const tekrar = searchParams.get("tekrar") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { adi: { contains: search } },
        { kurum: { contains: search } },
        { yer: { contains: search } },
      ];
    }

    if (tarih) {
      where.tarih = new Date(tarih);
    }

    if (tekrar === "true") {
      where.tekrar_yillik = true;
    } else if (tekrar === "false") {
      where.tekrar_yillik = false;
    }

    const [etkinlikler, total] = await Promise.all([
      prisma.etkinlikler.findMany({
        where,
        orderBy: [
          { tarih: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.etkinlikler.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedEtkinlikler = etkinlikler.map((etkinlik: any) => ({
      ...etkinlik,
      tarih: etkinlik.tarih ? dayjs(etkinlik.tarih).format("YYYY-MM-DD") : null,
      orijinal_tarih: etkinlik.orijinal_tarih ? dayjs(etkinlik.orijinal_tarih).format("YYYY-MM-DD") : null,
      created_at: etkinlik.created_at ? dayjs(etkinlik.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedEtkinlikler,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Etkinlik GET Error:", error);
    return NextResponse.json(
      { error: "Etkinlikler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni etkinlik
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = etkinlikSchema.parse(body);

    await prisma.etkinlikler.create({
      data: {
        adi: validated.adi || null,
        kurum: validated.kurum || null,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        orijinal_tarih: validated.orijinal_tarih ? new Date(validated.orijinal_tarih) : null,
        saat: validated.saat || null,
        yer: validated.yer || null,
        detay: validated.detay || null,
        tekrar_yillik: validated.tekrar_yillik || false,
      },
    });

    return NextResponse.json({
      message: "Etkinlik başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Etkinlik POST Error:", error);
    return NextResponse.json(
      { error: "Etkinlik eklenemedi" },
      { status: 500 }
    );
  }
}
