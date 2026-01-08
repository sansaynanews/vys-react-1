import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const projeSchema = z.object({
  konu: z.string().min(1, "Konu gerekli"),
  sahibi: z.string().min(1, "Proje sahibi gerekli"),
  kurum: z.string().optional(),
  iletisim: z.string().optional(),
  baslangic: z.string().optional(),
  bitis: z.string().optional(),
  durum: z.string().optional(),
  hedefler: z.string().optional(),
});

// GET - Proje listesi
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

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { konu: { contains: search } },
        { sahibi: { contains: search } },
        { kurum: { contains: search } },
      ];
    }

    if (durum) {
      where.durum = durum;
    }

    const [projeler, total] = await Promise.all([
      prisma.projeler.findMany({
        where,
        orderBy: [
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.projeler.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedProjeler = projeler.map((proje: any) => ({
      ...proje,
      baslangic: proje.baslangic ? dayjs(proje.baslangic).format("YYYY-MM-DD") : null,
      bitis: proje.bitis ? dayjs(proje.bitis).format("YYYY-MM-DD") : null,
      created_at: proje.created_at ? dayjs(proje.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedProjeler,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Proje GET Error:", error);
    return NextResponse.json(
      { error: "Projeler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni proje
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = projeSchema.parse(body);

    await prisma.projeler.create({
      data: {
        konu: validated.konu,
        sahibi: validated.sahibi,
        kurum: validated.kurum || null,
        iletisim: validated.iletisim || null,
        baslangic: validated.baslangic ? new Date(validated.baslangic) : null,
        bitis: validated.bitis ? new Date(validated.bitis) : null,
        durum: validated.durum || "Beklemede",
        hedefler: validated.hedefler || null,
      },
    });

    return NextResponse.json({
      message: "Proje başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Proje POST Error:", error);
    return NextResponse.json(
      { error: "Proje eklenemedi" },
      { status: 500 }
    );
  }
}
