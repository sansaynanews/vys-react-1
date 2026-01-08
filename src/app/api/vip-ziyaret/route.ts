import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const vipSchema = z.object({
  protokol_turu: z.string().optional(),
  ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
  gelis_tarihi: z.string().optional(), // YYYY-MM-DD
  gelis_saati: z.string().optional(),
  karsilama_yeri: z.string().optional(),
  konaklama_yeri: z.string().optional(),
  notlar: z.string().optional(),
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

    const where: any = {};
    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { protokol_turu: { contains: search } },
      ];
    }

    const items = await prisma.ust_duzey_ziyaret.findMany({
      where,
      orderBy: { gelis_tarihi: "desc" },
    });

    return NextResponse.json({
      data: items.map(item => ({
        ...item,
        gelis_tarihi: item.gelis_tarihi ? dayjs(item.gelis_tarihi).format("YYYY-MM-DD") : null,
      }))
    });
  } catch (error) {
    console.error("VIP GET Error:", error);
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
    const validated = vipSchema.parse(body);

    const data: any = { ...validated };
    if (data.gelis_tarihi) data.gelis_tarihi = new Date(data.gelis_tarihi);

    const item = await prisma.ust_duzey_ziyaret.create({ data });

    return NextResponse.json({
      message: "VIP Ziyaret kaydedildi",
      data: item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
