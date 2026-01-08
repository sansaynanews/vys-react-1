import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const izinSchema = z.object({
  personel_id: z.number().min(1, "Personel seçiniz"),
  personel_ad: z.string().optional(),
  personel_birim: z.string().optional(),
  turu: z.string().min(1, "İzin türü gerekli"),
  baslangic: z.string().min(1, "Başlangıç tarihi gerekli"),
  bitis: z.string().min(1, "Bitiş tarihi gerekli"),
  mesai_tarihi: z.string().optional(),
  mesai_saati: z.string().optional(),
  aciklama: z.string().optional(),
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
    const personel_id = searchParams.get("personel_id");
    const turu = searchParams.get("turu") || "";
    const durum = searchParams.get("durum") || ""; // aktif, gecmis, gelecek

    const skip = (page - 1) * limit;
    const today = dayjs();

    // Filtreler
    const where: any = {};

    if (personel_id) {
      where.personel_id = parseInt(personel_id);
    }

    if (turu) {
      where.turu = turu;
    }

    // Durum filtresi
    if (durum === "aktif") {
      // Şu anda devam eden izinler
      where.baslangic = { lte: today.toDate() };
      where.bitis = { gte: today.toDate() };
    } else if (durum === "gecmis") {
      where.bitis = { lt: today.toDate() };
    } else if (durum === "gelecek") {
      where.baslangic = { gt: today.toDate() };
    }

    const [izinler, total] = await Promise.all([
      prisma.personel_izinleri.findMany({
        where,
        orderBy: {
          baslangic: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.personel_izinleri.count({ where }),
    ]);

    // Tarihleri formatla ve durum ekle
    const formattedIzinler = izinler.map((izin: any) => {
      const baslangic = dayjs(izin.baslangic);
      const bitis = dayjs(izin.bitis);
      const gunSayisi = bitis.diff(baslangic, "day") + 1;

      let durum = "bekliyor";
      if (today.isBefore(baslangic)) {
        durum = "gelecek";
      } else if (today.isAfter(bitis)) {
        durum = "gecmis";
      } else {
        durum = "aktif";
      }

      return {
        ...izin,
        baslangic: izin.baslangic ? dayjs(izin.baslangic).format("YYYY-MM-DD") : null,
        bitis: izin.bitis ? dayjs(izin.bitis).format("YYYY-MM-DD") : null,
        mesai_tarihi: izin.mesai_tarihi ? dayjs(izin.mesai_tarihi).format("YYYY-MM-DD") : null,
        created_at: izin.created_at ? dayjs(izin.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
        gunSayisi,
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
    console.error("İzin GET Error:", error);
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

    // Personel bilgilerini getir
    const personel = await prisma.personeller.findUnique({
      where: { id: validated.personel_id },
    });

    if (!personel) {
      return NextResponse.json(
        { error: "Personel bulunamadı" },
        { status: 404 }
      );
    }

    // İzin günü hesapla
    const baslangic = dayjs(validated.baslangic);
    const bitis = dayjs(validated.bitis);
    const izinGunu = bitis.diff(baslangic, "day") + 1;

    // Yıllık izin kontrolü (sadece "Yıllık İzin" türü için)
    if (validated.turu === "Yıllık İzin") {
      const kalanIzin = (personel.toplam_izin || 14) - (personel.kullanilan_izin || 0);
      if (izinGunu > kalanIzin) {
        return NextResponse.json(
          { error: `Yetersiz izin hakkı. Kalan izin: ${kalanIzin} gün` },
          { status: 400 }
        );
      }

      // Kullanılan izni güncelle
      await prisma.personeller.update({
        where: { id: validated.personel_id },
        data: {
          kullanilan_izin: (personel.kullanilan_izin || 0) + izinGunu,
        },
      });
    }

    const izin = await prisma.personel_izinleri.create({
      data: {
        personel_id: validated.personel_id,
        personel_ad: validated.personel_ad || personel.ad_soyad,
        personel_birim: validated.personel_birim || personel.birim,
        turu: validated.turu,
        baslangic: new Date(validated.baslangic),
        bitis: new Date(validated.bitis),
        mesai_tarihi: validated.mesai_tarihi ? new Date(validated.mesai_tarihi) : null,
        mesai_saati: validated.mesai_saati || null,
        aciklama: validated.aciklama || null,
      },
    });

    return NextResponse.json({
      message: "İzin kaydı başarıyla oluşturuldu",
      data: izin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("İzin POST Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı oluşturulamadı" },
      { status: 500 }
    );
  }
}
