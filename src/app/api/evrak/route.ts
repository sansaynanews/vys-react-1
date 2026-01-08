import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const evrakSchema = z.object({
  gelen_kurum: z.string().optional(),
  tur: z.string().optional(),
  konu: z.string().min(1, "Konu gerekli"),
  notlar: z.string().optional(),
  evrak_tarih: z.string().optional(), // YYYY-MM-DD
  evrak_sayi: z.string().optional(),
  gelis_tarih: z.string().optional(), // YYYY-MM-DD
  teslim_alan: z.string().optional(),
  sunus_tarihi: z.string().optional().or(z.literal("")),
  cikis_tarihi: z.string().optional().or(z.literal("")),
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (search) {
      where.OR = [
        { konu: { contains: search } },
        { gelen_kurum: { contains: search } },
        { evrak_sayi: { contains: search } },
      ];
    }

    if (startDate && endDate) {
      where.gelis_tarih = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const evraklar = await prisma.evraklar.findMany({
      where,
      orderBy: { gelis_tarih: "desc" },
    });

    return NextResponse.json({
      data: evraklar.map(e => ({
        ...e,
        gelis_tarih: e.gelis_tarih ? dayjs(e.gelis_tarih).format("YYYY-MM-DD") : null,
        evrak_tarih: e.evrak_tarih ? dayjs(e.evrak_tarih).format("YYYY-MM-DD") : null,
        sunus_tarihi: e.sunus_tarihi ? dayjs(e.sunus_tarihi).format("YYYY-MM-DD") : null,
        cikis_tarihi: e.cikis_tarihi ? dayjs(e.cikis_tarihi).format("YYYY-MM-DD") : null,
      }))
    });
  } catch (error) {
    console.error("Evrak GET Error:", error);
    return NextResponse.json(
      { error: "Liste getirilemedi" },
      { status: 500 }
    );
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
    const validated = evrakSchema.parse(body);

    const data: any = { ...validated };

    if (data.evrak_tarih) data.evrak_tarih = new Date(data.evrak_tarih);
    if (data.gelis_tarih) data.gelis_tarih = new Date(data.gelis_tarih);
    if (data.sunus_tarihi) data.sunus_tarihi = new Date(data.sunus_tarihi);
    if (data.cikis_tarihi) data.cikis_tarihi = new Date(data.cikis_tarihi);

    const evrak = await prisma.evraklar.create({
      data,
    });

    return NextResponse.json({
      message: "Evrak kaydedildi",
      data: evrak,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Evrak POST Error:", error);
    return NextResponse.json(
      { error: "Kayıt oluşturulamadı" },
      { status: 500 }
    );
  }
}
