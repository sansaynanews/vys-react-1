import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const gunlukProgramSchema = z.object({
  tarih: z.string().min(1, "Tarih gerekli"),
  saat: z.string().min(1, "Saat gerekli"),
  tur: z.string().optional(),
  aciklama: z.string().optional(),
});

// GET - Günlük program listesi
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
    const tur = searchParams.get("tur") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { aciklama: { contains: search } },
        { tur: { contains: search } },
      ];
    }

    if (tarih) {
      where.tarih = new Date(tarih);
    }

    if (tur) {
      where.tur = tur;
    }

    const [programlar, total] = await Promise.all([
      prisma.gunluk_program_manuel.findMany({
        where,
        orderBy: [
          { tarih: "desc" },
          { saat: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.gunluk_program_manuel.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedProgramlar = programlar.map((program: any) => ({
      ...program,
      tarih: program.tarih ? dayjs(program.tarih).format("YYYY-MM-DD") : null,
      created_at: program.created_at ? dayjs(program.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedProgramlar,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Gunluk Program GET Error:", error);
    return NextResponse.json(
      { error: "Günlük program getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni günlük program
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = gunlukProgramSchema.parse(body);

    await prisma.gunluk_program_manuel.create({
      data: {
        tarih: new Date(validated.tarih),
        saat: validated.saat,
        tur: validated.tur || null,
        aciklama: validated.aciklama || null,
      },
    });

    return NextResponse.json({
      message: "Günlük program başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Gunluk Program POST Error:", error);
    return NextResponse.json(
      { error: "Günlük program eklenemedi" },
      { status: 500 }
    );
  }
}
