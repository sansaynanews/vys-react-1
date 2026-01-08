import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const konusmaMetniSchema = z.object({
  kategori: z.string().min(1, "Kategori gerekli"),
  baslik: z.string().min(1, "Başlık gerekli"),
  icerik: z.string().min(1, "İçerik gerekli"),
  tarih: z.string().optional(),
  saat: z.string().optional(),
});

// GET - Konuşma metinleri listesi
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
    const kategori = searchParams.get("kategori") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { baslik: { contains: search } },
        { icerik: { contains: search } },
      ];
    }

    if (kategori) {
      where.kategori = kategori;
    }

    const [metinler, total] = await Promise.all([
      prisma.konusma_metinleri.findMany({
        where,
        orderBy: [
          { tarih: "desc" },
          { created_at: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.konusma_metinleri.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedMetinler = metinler.map((metin: any) => ({
      ...metin,
      tarih: metin.tarih ? dayjs(metin.tarih).format("YYYY-MM-DD") : null,
      created_at: metin.created_at ? dayjs(metin.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedMetinler,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Konusma Metni GET Error:", error);
    return NextResponse.json(
      { error: "Konuşma metinleri getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni konuşma metni
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = konusmaMetniSchema.parse(body);

    await prisma.konusma_metinleri.create({
      data: {
        kategori: validated.kategori,
        baslik: validated.baslik,
        icerik: validated.icerik,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        saat: validated.saat ? validated.saat : null,
      },
    });

    return NextResponse.json({
      message: "Konuşma metni başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Konusma Metni POST Error:", error);
    return NextResponse.json(
      { error: "Konuşma metni eklenemedi" },
      { status: 500 }
    );
  }
}
