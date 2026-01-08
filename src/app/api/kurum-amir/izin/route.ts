import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const izinSchema = z.object({
  kurum_adi: z.string().optional(),
  amir_ad: z.string().min(1, "Amir adı gerekli"),
  baslangic: z.string().min(1, "Başlangıç tarihi gerekli"),
  bitis: z.string().min(1, "Bitiş tarihi gerekli"),
  vekil_ad: z.string().optional(),
  vekil_unvan: z.string().optional(),
  vekil_tel: z.string().optional(),
  izin_turu: z.string().optional(),
});

// GET - İzin listesi
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
    const durum = searchParams.get("durum") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { kurum_adi: { contains: search } },
        { amir_ad: { contains: search } },
        { vekil_ad: { contains: search } },
      ];
    }

    // Durum filtreleme (devam_ediyor, gelecek, gecmis)
    const today = dayjs().startOf("day").toDate();

    if (durum === "devam_ediyor") {
      where.baslangic = { lte: today };
      where.bitis = { gte: today };
    } else if (durum === "gelecek") {
      where.baslangic = { gt: today };
    } else if (durum === "gecmis") {
      where.bitis = { lt: today };
    }

    const [izinler, total] = await Promise.all([
      prisma.amir_izinleri.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.amir_izinleri.count({ where }),
    ]);

    // Tarihleri formatla ve durum ekle
    const formattedIzinler = izinler.map((izin: any) => {
      const baslangic = izin.baslangic ? dayjs(izin.baslangic) : null;
      const bitis = izin.bitis ? dayjs(izin.bitis) : null;
      const now = dayjs();

      let durum = "gecmis";
      if (baslangic && bitis) {
        if (now.isBefore(baslangic, "day")) {
          durum = "gelecek";
        } else if (!now.isAfter(bitis, "day")) {
          durum = "devam_ediyor";
        }
      }

      return {
        ...izin,
        baslangic: baslangic ? baslangic.format("YYYY-MM-DD") : null,
        bitis: bitis ? bitis.format("YYYY-MM-DD") : null,
        created_at: izin.created_at ? dayjs(izin.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
        durum,
      };
    });

    return NextResponse.json({
      data: formattedIzinler,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Amir İzin GET Error:", error);
    return NextResponse.json(
      { error: "İzinler getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni izin
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = izinSchema.parse(body);

    // Tarih kontrolü
    const baslangic = dayjs(validated.baslangic);
    const bitis = dayjs(validated.bitis);

    if (bitis.isBefore(baslangic)) {
      return NextResponse.json(
        { error: "Bitiş tarihi başlangıç tarihinden önce olamaz" },
        { status: 400 }
      );
    }

    await prisma.amir_izinleri.create({
      data: {
        kurum_adi: validated.kurum_adi || null,
        amir_ad: validated.amir_ad,
        baslangic: new Date(validated.baslangic),
        bitis: new Date(validated.bitis),
        vekil_ad: validated.vekil_ad || null,
        vekil_unvan: validated.vekil_unvan || null,
        vekil_tel: validated.vekil_tel || null,
        izin_turu: validated.izin_turu || "Yıllık İzin",
      },
    });

    return NextResponse.json({
      message: "İzin kaydı başarıyla eklendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Amir İzin POST Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı eklenemedi" },
      { status: 500 }
    );
  }
}
