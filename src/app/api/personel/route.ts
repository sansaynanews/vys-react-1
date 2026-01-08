import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation Schema
const personelSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  birim: z.string().min(1, "Birim gerekli"),
  unvan: z.string().optional(),
  telefon: z.string().optional(),
  eposta: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
  acil_kisi: z.string().optional(),
  acil_tel: z.string().optional(),
  kan_grubu: z.string().optional(),
  baslama_tarihi: z.string().optional(),
  yabanci_dil: z.string().optional(),
  gorev_tanimi: z.string().optional(),
  aciklama: z.string().optional(),
  toplam_izin: z.number().optional(),
  kullanilan_izin: z.number().optional(),
  mesai_saati: z.number().optional(),
  rapor_gun: z.number().optional(),
});

// GET - Personel Listesi
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
    const birim = searchParams.get("birim") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      silindi: false, // Soft delete kontrolü
    };

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { unvan: { contains: search } },
      ];
    }

    if (birim) {
      where.birim = { contains: birim };
    }

    const [personeller, total] = await Promise.all([
      prisma.personeller.findMany({
        where,
        orderBy: { ad_soyad: "asc" },
        skip,
        take: limit,
      }),
      prisma.personeller.count({ where }),
    ]);

    return NextResponse.json({
      data: personeller.map((p: any) => ({
        ...p,
        baslama_tarihi: p.baslama_tarihi ? dayjs(p.baslama_tarihi).format("YYYY-MM-DD") : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Personel GET Error:", error);
    return NextResponse.json(
      { error: "Personel listesi getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni Personel
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = personelSchema.parse(body);

    const data: any = { ...validated };

    if (data.baslama_tarihi) {
      data.baslama_tarihi = new Date(data.baslama_tarihi);
    }

    const personel = await prisma.personeller.create({
      data: {
        ...data,
        silindi: false,
      },
    });

    return NextResponse.json({
      message: "Personel başarıyla kaydedildi",
      data: personel,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Personel POST Error:", error);
    return NextResponse.json(
      { error: "Personel kaydedilemedi" },
      { status: 500 }
    );
  }
}
