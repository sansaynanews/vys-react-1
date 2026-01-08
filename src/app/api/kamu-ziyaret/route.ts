import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const kamuZiyaretSchema = z.object({
  kurum: z.string().optional(),
  yer: z.string().optional(),
  tarih: z.string().optional(),
  saat: z.string().optional(),
  talepler: z.string().optional(),
});

// GET - Kamu ziyaret listesi
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
        { kurum: { contains: search } },
        { yer: { contains: search } },
      ];
    }

    if (tarih) {
      where.tarih = new Date(tarih);
    }

    const [ziyaretler, total] = await Promise.all([
      prisma.ziyaret_kamu.findMany({
        where,
        orderBy: [
          { tarih: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.ziyaret_kamu.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedZiyaretler = ziyaretler.map((ziyaret: any) => ({
      ...ziyaret,
      tarih: ziyaret.tarih ? dayjs(ziyaret.tarih).format("YYYY-MM-DD") : null,
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
    console.error("Kamu Ziyaret GET Error:", error);
    return NextResponse.json(
      { error: "Ziyaretler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni kamu ziyaret
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = kamuZiyaretSchema.parse(body);

    await prisma.ziyaret_kamu.create({
      data: {
        kurum: validated.kurum || null,
        yer: validated.yer || null,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        saat: validated.saat || null,
        talepler: validated.talepler || null,
      },
    });

    return NextResponse.json({
      message: "Kamu ziyareti başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Kamu Ziyaret POST Error:", error);
    return NextResponse.json(
      { error: "Kamu ziyareti eklenemedi" },
      { status: 500 }
    );
  }
}
