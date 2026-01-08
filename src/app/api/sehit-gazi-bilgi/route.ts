import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const bilgiSchema = z.object({
  tur: z.string().optional(), // Şehit / Gazi
  ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
  kurum: z.string().optional(),
  medeni: z.string().optional(),
  es_ad: z.string().optional(),
  anne_ad: z.string().optional(),
  baba_ad: z.string().optional(),
  cocuk_sayisi: z.any().optional(), // Can be string or int from form
  cocuk_adlari: z.string().optional(),
  olay_yeri: z.string().optional(),
  olay_tarih: z.string().optional(),
  foto: z.string().optional(),
});

// GET - List
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { es_ad: { contains: search } },
        { cocuk_adlari: { contains: search } },
      ];
    }
    if (type && type !== "Tümü") {
      where.tur = type;
    }

    const items = await prisma.sehit_gazi_bilgi.findMany({
      where,
      orderBy: { ad_soyad: "asc" },
    });

    return NextResponse.json({
      data: items.map(item => ({
        ...item,
        olay_tarih: item.olay_tarih ? dayjs(item.olay_tarih).format("YYYY-MM-DD") : null,
      }))
    });
  } catch (error) {
    console.error("Bilgi Bankası API Error:", error);
    return NextResponse.json({ error: "Liste getirilemedi" }, { status: 500 });
  }
}

// POST - Create
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = bilgiSchema.parse(body);

    const data: any = { ...validated };
    if (data.olay_tarih) data.olay_tarih = new Date(data.olay_tarih);
    if (data.cocuk_sayisi) data.cocuk_sayisi = parseInt(data.cocuk_sayisi);

    const item = await prisma.sehit_gazi_bilgi.create({ data });

    return NextResponse.json({
      message: "Kayıt oluşturuldu",
      data: item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
