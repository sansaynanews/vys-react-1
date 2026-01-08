import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation Schema
const rezervasyonSchema = z.object({
  salon_id: z.number().min(1, "Salon seçimi gerekli"),
  baslik: z.string().min(1, "Toplantı başlığı gerekli"),
  tur: z.string().optional(),
  rez_sahibi: z.string().optional(),
  departman: z.string().optional(),
  iletisim: z.string().optional(),
  tarih: z.string().min(1, "Tarih gerekli"),
  bas_saat: z.string().min(1, "Başlangıç saati gerekli"),
  bit_saat: z.string().min(1, "Bitiş saati gerekli"),
  kararlar: z.string().optional(),
});

// Yardımcı fonksiyon: Çakışma Kontrolü
async function checkConflict(salonId: number, tarih: string, basSaat: string, bitSaat: string, excludeId?: number) {
  const existing = await prisma.salon_rezervasyonlari.findMany({
    where: {
      salon_id: salonId,
      tarih: new Date(tarih),
      id: excludeId ? { not: excludeId } : undefined,
    },
  });

  // Hızlı kontrol: String karşılaştırması "09:00" < "10:00" çalışır
  return existing.some((rez) => {
    // Mevcut (DB)
    const dbBas = rez.bas_saat || "00:00";
    const dbBit = rez.bit_saat || "23:59";

    // Yeni (Input)
    const newBas = basSaat;
    const newBit = bitSaat;

    // Overlap Logic: (StartA < EndB) and (EndA > StartB)
    return (dbBas < newBit) && (dbBit > newBas);
  });
}

// GET - Rezervasyon Listesi
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const salonId = searchParams.get("salon_id");
    const basTarih = searchParams.get("bas_tarih");
    const bitTarih = searchParams.get("bit_tarih");

    const where: any = {};

    if (search) {
      where.baslik = { contains: search };
    }

    if (salonId) {
      where.salon_id = parseInt(salonId);
    }

    if (basTarih && bitTarih) {
      where.tarih = {
        gte: new Date(basTarih),
        lte: new Date(bitTarih),
      };
    } else if (basTarih) {
      // Sadece tek gün veya sonrası
      where.tarih = { gte: new Date(basTarih) };
    }

    const rezervasyonlar = await prisma.salon_rezervasyonlari.findMany({
      where,
      orderBy: [
        { tarih: "desc" },
        { bas_saat: "asc" }
      ],
      take: 100 // Limit for now
    });

    return NextResponse.json({
      data: rezervasyonlar.map(r => ({
        ...r,
        tarih: r.tarih ? dayjs(r.tarih).format("YYYY-MM-DD") : null
      }))
    });
  } catch (error) {
    console.error("Rezervasyon GET Error:", error);
    return NextResponse.json(
      { error: "Rezervasyonlar getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni Rezervasyon
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = rezervasyonSchema.parse(body);

    // Çakışma kontrolü
    const hasConflict = await checkConflict(
      validated.salon_id,
      validated.tarih,
      validated.bas_saat,
      validated.bit_saat
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: "Bu saat aralığında salon dolu!" },
        { status: 409 }
      );
    }

    // Salon adını bul
    const salon = await prisma.toplanti_salonlari.findUnique({
      where: { id: validated.salon_id },
      select: { ad: true }
    });

    const rezervasyon = await prisma.salon_rezervasyonlari.create({
      data: {
        ...validated,
        tarih: new Date(validated.tarih),
        salon_ad: salon?.ad || "",
      },
    });

    return NextResponse.json({
      message: "Rezervasyon başarıyla oluşturuldu",
      data: rezervasyon,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Rezervasyon POST Error:", error);
    return NextResponse.json(
      { error: "Rezervasyon oluşturulamadı" },
      { status: 500 }
    );
  }
}
