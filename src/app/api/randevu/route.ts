import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const randevuSchema = z.object({
  tipi: z.string().default("Randevu"),
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  kurum: z.string().min(1, "Kurum gerekli"),
  unvan: z.string().optional(),
  iletisim: z.string().optional(),
  tarih: z.string().min(1, "Tarih gerekli"),
  saat: z.string().min(1, "Saat gerekli"),
  amac: z.string().optional(),
  notlar: z.string().optional(),
  durum: z.string().optional(),
});

// GET - Liste
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
    const durum = searchParams.get("durum") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { kurum: { contains: search } },
        { amac: { contains: search } },
      ];
    }

    if (tarih) {
      where.tarih = new Date(tarih);
    }

    if (durum) {
      where.durum = durum;
    }

    const [randevular, total] = await Promise.all([
      prisma.randevular.findMany({
        where,
        orderBy: [
          { tarih: "desc" },
          { saat: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.randevular.count({ where }),
    ]);

    return NextResponse.json({
      data: randevular.map((r: any) => ({
        ...r,
        tarih: r.tarih ? dayjs(r.tarih).format("YYYY-MM-DD") : null,
        created_at: r.created_at ? dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Randevu GET Error:", error);
    return NextResponse.json(
      { error: "Randevular getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni randevu
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = randevuSchema.parse(body);

    // Tarih ve saat çakışma kontrolü (opsiyonel)
    const existing = await prisma.randevular.findFirst({
      where: {
        tarih: new Date(validated.tarih),
        saat: validated.saat,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu tarih ve saatte zaten bir randevu var" },
        { status: 400 }
      );
    }

    const randevu = await prisma.randevular.create({
      data: {
        tipi: validated.tipi,
        ad_soyad: validated.ad_soyad,
        kurum: validated.kurum,
        unvan: validated.unvan || null,
        iletisim: validated.iletisim || null,
        amac: validated.amac || null,
        tarih: new Date(validated.tarih),
        saat: validated.saat,
        durum: validated.durum || "Bekliyor",
        notlar: validated.notlar || null,
      },
    });

    return NextResponse.json({
      message: "Randevu başarıyla oluşturuldu",
      data: {
        ...randevu,
        tarih: dayjs(randevu.tarih).format("YYYY-MM-DD"),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Randevu POST Error:", error);
    return NextResponse.json(
      { error: "Randevu oluşturulamadı" },
      { status: 500 }
    );
  }
}
