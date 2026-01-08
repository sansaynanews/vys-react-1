import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const salonSchema = z.object({
  ad: z.string().min(1, "Salon adı gerekli"),
  kapasite: z.number().optional(),
  konum: z.string().optional(),
  ekipman: z.string().optional(),
  notlar: z.string().optional(),
});

// GET - Salon listesi
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

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { ad: { contains: search } },
        { konum: { contains: search } },
      ];
    }

    const [salonlar, total] = await Promise.all([
      prisma.toplanti_salonlari.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.toplanti_salonlari.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedSalonlar = salonlar.map((salon: any) => ({
      ...salon,
      created_at: salon.created_at ? dayjs(salon.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedSalonlar,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Salon GET Error:", error);
    return NextResponse.json(
      { error: "Salonlar getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni salon
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = salonSchema.parse(body);

    // Salon adı kontrolü
    const existing = await prisma.toplanti_salonlari.findFirst({
      where: {
        ad: validated.ad,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu isimde bir salon zaten mevcut" },
        { status: 400 }
      );
    }

    const salon = await prisma.toplanti_salonlari.create({
      data: {
        ad: validated.ad,
        kapasite: validated.kapasite || null,
        konum: validated.konum || null,
        ekipman: validated.ekipman || null,
        notlar: validated.notlar || null,
      },
    });

    return NextResponse.json({
      message: "Salon başarıyla oluşturuldu",
      data: salon,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Salon POST Error:", error);
    return NextResponse.json(
      { error: "Salon oluşturulamadı" },
      { status: 500 }
    );
  }
}
