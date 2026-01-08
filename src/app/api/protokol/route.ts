import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const protokolSchema = z.object({
  sira_no: z.number().optional(),
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  unvan: z.string().optional(),
  kurum: z.string().optional(),
  telefon: z.string().optional(),
  eposta: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
});

// GET - Protokol listesi
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
        { ad_soyad: { contains: search } },
        { unvan: { contains: search } },
        { kurum: { contains: search } },
        { telefon: { contains: search } },
        { eposta: { contains: search } },
      ];
    }

    if (kurum) {
      where.kurum = kurum;
    }

    const [protokoller, total] = await Promise.all([
      prisma.protokol_listesi.findMany({
        where,
        orderBy: [
          { sira_no: "asc" },
          { ad_soyad: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.protokol_listesi.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedProtokoller = protokoller.map((protokol: any) => ({
      ...protokol,
      created_at: protokol.created_at ? dayjs(protokol.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedProtokoller,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Protokol GET Error:", error);
    return NextResponse.json(
      { error: "Protokol listesi getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni protokol
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = protokolSchema.parse(body);

    await prisma.protokol_listesi.create({
      data: {
        sira_no: validated.sira_no || null,
        ad_soyad: validated.ad_soyad,
        unvan: validated.unvan || null,
        kurum: validated.kurum || null,
        telefon: validated.telefon || null,
        eposta: validated.eposta || null,
      },
    });

    return NextResponse.json({
      message: "Protokol kaydı başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Protokol POST Error:", error);
    return NextResponse.json(
      { error: "Protokol kaydı eklenemedi" },
      { status: 500 }
    );
  }
}
