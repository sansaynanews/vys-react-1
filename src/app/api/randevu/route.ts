import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";
import { notifyAppointmentCreated } from "@/lib/notifications";

// Validation schema
const randevuSchema = z.object({
  tipi: z.string().default("Randevu"),
  talep_kaynagi: z.string().optional(), // Telefon, Web, Dilekçe, Sözlü, Protokol
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  kurum: z.string().min(1, "Kurum gerekli"),
  unvan: z.string().optional(),
  iletisim: z.string().optional(),
  tarih: z.string().min(1, "Tarih gerekli"),
  saat: z.string().min(1, "Saat gerekli"),
  amac: z.string().optional(),
  notlar: z.string().optional(),
  durum: z.string().optional(),
  katilimci: z.number().optional(),
  hediye_notu: z.string().optional(),
  repeat: z.object({
    type: z.enum(["daily", "weekly", "biweekly", "monthly"]),
    endDate: z.string(),
  }).optional(),
  arac_plaka: z.string().optional(),
});



// GET - Liste
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const durum = searchParams.get("durum") || "";

    const skip = (page - 1) * limit;

    // Filtreler
    const where: any = {};

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { kurum: { contains: search } },
        { amac: { contains: search } },
      ];
    }

    if (tarih) {
      where.tarih = new Date(tarih);
    } else if (startDate && endDate) {
      where.tarih = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (durum) {
      where.durum = durum;
    }

    const [randevular, total] = await Promise.all([
      prisma.randevular.findMany({
        where,
        orderBy: [
          { tarih: "desc" },
          { saat: "desc" },
        ],
        skip,
        take: limit,
        include: {
          talimatlar: true
        }
      }),
      prisma.randevular.count({ where }),
    ]);

    return NextResponse.json({
      data: randevular.map((r: any) => ({
        ...r,
        tarih: r.tarih ? dayjs(r.tarih).format("YYYY-MM-DD") : null,
        created_at: r.created_at ? dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Randevu GET Error:", error);
    return NextResponse.json(
      { error: "Randevular getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni randevu
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = randevuSchema.parse(body);

    // Tekrarlayan Randevu Mantığı
    if (validated.repeat) {
      const { repeat, ...baseData } = validated;
      const startDate = dayjs(baseData.tarih);
      const endDate = dayjs(repeat.endDate);
      const appointmentsToCreate = [];
      let currentDate = startDate;
      const repeatId = crypto.randomUUID(); // Unique ID for the series

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        appointmentsToCreate.push({
          tipi: baseData.tipi,
          ad_soyad: baseData.ad_soyad,
          kurum: baseData.kurum,
          unvan: baseData.unvan || null,
          iletisim: baseData.iletisim || null,
          amac: baseData.amac || null,
          tarih: currentDate.toDate(),
          saat: baseData.saat,
          durum: baseData.durum || "Bekliyor",
          notlar: baseData.notlar || null,
          hediye_notu: baseData.hediye_notu || null,
          arac_plaka: baseData.arac_plaka || null,
          katilimci: baseData.katilimci || 1,
          tekrar_id: repeatId,
          tekrar_bilgisi: `${repeat.type === "weekly" ? "Haftalık" : repeat.type === "monthly" ? "Aylık" : repeat.type === "daily" ? "Günlük" : "İki Haftalık"}`,
        });

        if (repeat.type === "daily") currentDate = currentDate.add(1, 'day');
        else if (repeat.type === "weekly") currentDate = currentDate.add(1, 'week');
        else if (repeat.type === "biweekly") currentDate = currentDate.add(2, 'week');
        else if (repeat.type === "monthly") currentDate = currentDate.add(1, 'month');
      }

      await prisma.randevular.createMany({ data: appointmentsToCreate });

      return NextResponse.json({
        message: `${appointmentsToCreate.length} adet randevu oluşturuldu`,
        count: appointmentsToCreate.length
      });
    }

    // Tarih ve saat çakışma kontrolü (opsiyonel)
    const existing = await prisma.randevular.findFirst({
      where: {
        tarih: new Date(validated.tarih),
        saat: validated.saat,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu tarih ve saatte zaten bir randevu var" },
        { status: 400 }
      );
    }

    const randevu = await prisma.randevular.create({
      data: {
        tipi: validated.tipi,
        ad_soyad: validated.ad_soyad,
        kurum: validated.kurum,
        unvan: validated.unvan || null,
        iletisim: validated.iletisim || null,
        amac: validated.amac || null,
        tarih: new Date(validated.tarih),
        saat: validated.saat,
        durum: validated.durum || "Bekliyor",
        notlar: validated.notlar || null,
        hediye_notu: validated.hediye_notu || null,
        arac_plaka: validated.arac_plaka || null,
        katilimci: validated.katilimci || 1, // Save participant count
      },
    });

    // Send Notification (Async, don't block response)
    notifyAppointmentCreated(randevu).catch(e => console.error("Notification failed", e));

    return NextResponse.json({
      message: "Randevu başarıyla oluşturuldu",
      data: {
        ...randevu,
        tarih: dayjs(randevu.tarih).format("YYYY-MM-DD"),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Randevu POST Error:", error);
    return NextResponse.json(
      { error: "Randevu oluşturulamadı" },
      { status: 500 }
    );
  }
}
