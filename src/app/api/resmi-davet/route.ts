import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const resmiDavetSchema = z.object({
  tur: z.string().min(1, "Davet türü gerekli"),
  sahip: z.string().min(1, "Davet sahibi gerekli"),
  tarih: z.string().optional(),
  saat: z.string().optional(),
  yer: z.string().optional(),
  aciklama: z.string().optional(),
  getiren: z.string().optional(),
  gelis_sekli: z.string().optional(),
  iletisim: z.string().optional(),
  gelis_tarih: z.string().optional(),
  gelis_saat: z.string().optional(),
  katilim_durumu: z.string().optional(),
});

// GET - Resmi Davet listesi
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
    const tur = searchParams.get("tur") || "";
    const katilim_durumu = searchParams.get("katilim_durumu") || "";
    const durum = searchParams.get("durum") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { sahip: { contains: search } },
        { yer: { contains: search } },
        { getiren: { contains: search } },
      ];
    }

    if (tur) {
      where.tur = tur;
    }

    if (katilim_durumu) {
      where.katilim_durumu = katilim_durumu;
    }

    // Durum filtreleme (gelecek, gecmis)
    const today = dayjs().startOf("day").toDate();

    if (durum === "gelecek") {
      where.tarih = { gte: today };
    } else if (durum === "gecmis") {
      where.tarih = { lt: today };
    }

    const [davetler, total] = await Promise.all([
      prisma.resmi_davetler.findMany({
        where,
        orderBy: {
          tarih: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.resmi_davetler.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedDavetler = davetler.map((davet: any) => ({
      ...davet,
      tarih: davet.tarih ? dayjs(davet.tarih).format("YYYY-MM-DD") : null,
      gelis_tarih: davet.gelis_tarih ? dayjs(davet.gelis_tarih).format("YYYY-MM-DD") : null,
      gelis_tarihi: davet.gelis_tarihi ? dayjs(davet.gelis_tarihi).format("YYYY-MM-DD") : null,
      created_at: davet.created_at ? dayjs(davet.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedDavetler,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Resmi Davet GET Error:", error);
    return NextResponse.json(
      { error: "Resmi davetler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni resmi davet
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = resmiDavetSchema.parse(body);

    await prisma.resmi_davetler.create({
      data: {
        tur: validated.tur,
        sahip: validated.sahip,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        saat: validated.saat || null,
        yer: validated.yer || null,
        aciklama: validated.aciklama || null,
        getiren: validated.getiren || null,
        gelis_sekli: validated.gelis_sekli || null,
        iletisim: validated.iletisim || null,
        gelis_tarih: validated.gelis_tarih ? new Date(validated.gelis_tarih) : null,
        gelis_saat: validated.gelis_saat || null,
        katilim_durumu: validated.katilim_durumu || "Belirsiz",
      },
    });

    return NextResponse.json({
      message: "Resmi davet başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Resmi Davet POST Error:", error);
    return NextResponse.json(
      { error: "Resmi davet eklenemedi" },
      { status: 500 }
    );
  }
}
