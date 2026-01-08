import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const ziyaretciKayitSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  unvan: z.string().optional(),
  kurum: z.string().optional(),
  iletisim: z.string().optional(),
  giris_tarihi: z.string().min(1, "Giriş tarihi gerekli"),
  giris_saati: z.string().min(1, "Giriş saati gerekli"),
  cikis_saati: z.string().optional(),
  kisi_sayisi: z.number().optional(),
  diger_kisiler: z.string().optional(),
});

// GET - Ziyaretçi kayıt listesi
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
    const aktif = searchParams.get("aktif") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { kurum: { contains: search } },
        { unvan: { contains: search } },
      ];
    }

    if (tarih) {
      where.giris_tarihi = new Date(tarih);
    }

    // Aktif ziyaretçiler (çıkış yapmamış)
    if (aktif === "true") {
      where.cikis_saati = null;
    } else if (aktif === "false") {
      where.cikis_saati = { not: null };
    }

    const [kayitlar, total] = await Promise.all([
      prisma.ziyaretci_kayitlari.findMany({
        where,
        orderBy: [
          { giris_tarihi: "desc" },
          { giris_saati: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.ziyaretci_kayitlari.count({ where }),
    ]);

    // Tarihleri formatla
    const formattedKayitlar = kayitlar.map((kayit: any) => ({
      ...kayit,
      giris_tarihi: kayit.giris_tarihi ? dayjs(kayit.giris_tarihi).format("YYYY-MM-DD") : null,
      created_at: kayit.created_at ? dayjs(kayit.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    }));

    return NextResponse.json({
      data: formattedKayitlar,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ziyaretci Kayit GET Error:", error);
    return NextResponse.json(
      { error: "Ziyaretçi kayıtları getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni ziyaretçi kaydı
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = ziyaretciKayitSchema.parse(body);

    await prisma.ziyaretci_kayitlari.create({
      data: {
        ad_soyad: validated.ad_soyad,
        unvan: validated.unvan || null,
        kurum: validated.kurum || null,
        iletisim: validated.iletisim || null,
        giris_tarihi: new Date(validated.giris_tarihi),
        giris_saati: validated.giris_saati,
        cikis_saati: validated.cikis_saati || null,
        kisi_sayisi: validated.kisi_sayisi || 1,
        diger_kisiler: validated.diger_kisiler || null,
      },
    });

    return NextResponse.json({
      message: "Ziyaretçi kaydı başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Ziyaretci Kayit POST Error:", error);
    return NextResponse.json(
      { error: "Ziyaretçi kaydı eklenemedi" },
      { status: 500 }
    );
  }
}
