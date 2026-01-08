import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const evrakSchema = z.object({
  gelen_kurum: z.string().min(1, "Gelen kurum gerekli"),
  tur: z.string().min(1, "Evrak türü gerekli"),
  konu: z.string().min(1, "Konu gerekli"),
  notlar: z.string().optional(),
  evrak_tarih: z.string().optional(),
  evrak_sayi: z.string().optional(),
  gelis_tarih: z.string().optional(),
  teslim_alan: z.string().optional(),
  cikis_tarihi: z.string().optional().nullable(),
  sunus_tarihi: z.string().optional().nullable(),
  saat: z.string().optional(),
});

// GET - Evrak listesi
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
    const durum = searchParams.get("durum") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { gelen_kurum: { contains: search } },
        { konu: { contains: search } },
        { evrak_sayi: { contains: search } },
        { teslim_alan: { contains: search } },
      ];
    }

    if (tur) {
      where.tur = tur;
    }

    // Durum filtreleme (bekliyor, tamamlandı)
    if (durum === "bekliyor") {
      where.sunus_tarihi = null;
    } else if (durum === "tamamlandi") {
      where.sunus_tarihi = { not: null };
    }

    const [evraklar, total] = await Promise.all([
      prisma.evraklar.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.evraklar.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedEvraklar = evraklar.map((evrak: any) => ({
      ...evrak,
      evrak_tarih: evrak.evrak_tarih ? dayjs(evrak.evrak_tarih).format("YYYY-MM-DD") : null,
      gelis_tarih: evrak.gelis_tarih ? dayjs(evrak.gelis_tarih).format("YYYY-MM-DD") : null,
      cikis_tarihi: evrak.cikis_tarihi ? dayjs(evrak.cikis_tarihi).format("YYYY-MM-DD") : null,
      sunus_tarihi: evrak.sunus_tarihi ? dayjs(evrak.sunus_tarihi).format("YYYY-MM-DD") : null,
      created_at: evrak.created_at ? dayjs(evrak.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedEvraklar,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Evrak GET Error:", error);
    return NextResponse.json(
      { error: "Evraklar getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni evrak
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = evrakSchema.parse(body);

    await prisma.evraklar.create({
      data: {
        gelen_kurum: validated.gelen_kurum,
        tur: validated.tur,
        konu: validated.konu,
        notlar: validated.notlar || null,
        evrak_tarih: validated.evrak_tarih ? new Date(validated.evrak_tarih) : null,
        evrak_sayi: validated.evrak_sayi || null,
        gelis_tarih: validated.gelis_tarih ? new Date(validated.gelis_tarih) : null,
        teslim_alan: validated.teslim_alan || null,
        cikis_tarihi: validated.cikis_tarihi ? new Date(validated.cikis_tarihi) : null,
        sunus_tarihi: validated.sunus_tarihi ? new Date(validated.sunus_tarihi) : null,
        saat: validated.saat ? new Date(`1970-01-01T${validated.saat}`) : null,
      },
    });

    return NextResponse.json({
      message: "Evrak başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Evrak POST Error:", error);
    return NextResponse.json(
      { error: "Evrak eklenemedi" },
      { status: 500 }
    );
  }
}
