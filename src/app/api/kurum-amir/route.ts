import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const kurumAmirSchema = z.object({
  kurum_adi: z.string().min(1, "Kurum adı gerekli"),
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  unvan: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  gsm: z.string().optional(),
  sabit_tel: z.string().optional(),
  foto: z.string().optional(),
});

// GET - Kurum Amirleri listesi
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

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { kurum_adi: { contains: search } },
        { ad_soyad: { contains: search } },
        { unvan: { contains: search } },
        { email: { contains: search } },
        { gsm: { contains: search } },
      ];
    }

    if (kurum) {
      where.kurum_adi = kurum;
    }

    const [amirler, total] = await Promise.all([
      prisma.kurum_amirleri.findMany({
        where,
        orderBy: [
          { kurum_adi: "asc" },
          { ad_soyad: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.kurum_amirleri.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedAmirler = amirler.map((amir: any) => ({
      ...amir,
      created_at: amir.created_at ? dayjs(amir.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedAmirler,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Kurum Amir GET Error:", error);
    return NextResponse.json(
      { error: "Kurum amirleri getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni kurum amiri
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = kurumAmirSchema.parse(body);

    await prisma.kurum_amirleri.create({
      data: {
        kurum_adi: validated.kurum_adi,
        ad_soyad: validated.ad_soyad,
        unvan: validated.unvan || null,
        email: validated.email || null,
        gsm: validated.gsm || null,
        sabit_tel: validated.sabit_tel || null,
        foto: validated.foto || null,
      },
    });

    return NextResponse.json({
      message: "Kurum amiri başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Kurum Amir POST Error:", error);
    return NextResponse.json(
      { error: "Kurum amiri eklenemedi" },
      { status: 500 }
    );
  }
}
