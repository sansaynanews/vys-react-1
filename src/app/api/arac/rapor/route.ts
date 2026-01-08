import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

// GET - Araç raporları
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const raporTuru = searchParams.get("tur") || "genel";

    const today = dayjs();
    const thirtyDaysLater = today.add(30, "day");

    switch (raporTuru) {
      case "genel": {
        // Genel istatistikler
        const [
          toplamArac,
          muayeneSuresiYaklasan,
          muayeneSuresiGecmis,
          sigortaSuresiYaklasan,
          sigortaSuresiGecmis,
          kaskoSuresiYaklasan,
          kaskoSuresiGecmis,
          kurumBazinda,
        ] = await Promise.all([
          // Toplam araç sayısı
          prisma.araclar.count(),

          // Muayene süresi 30 gün içinde
          prisma.araclar.count({
            where: {
              muayene_bit: {
                gte: today.toDate(),
                lte: thirtyDaysLater.toDate(),
              },
            },
          }),

          // Muayene süresi geçmiş
          prisma.araclar.count({
            where: {
              muayene_bit: {
                lt: today.toDate(),
              },
            },
          }),

          // Sigorta süresi 30 gün içinde
          prisma.araclar.count({
            where: {
              sigorta_bit: {
                gte: today.toDate(),
                lte: thirtyDaysLater.toDate(),
              },
            },
          }),

          // Sigorta süresi geçmiş
          prisma.araclar.count({
            where: {
              sigorta_bit: {
                lt: today.toDate(),
              },
            },
          }),

          // Kasko süresi 30 gün içinde
          prisma.araclar.count({
            where: {
              kasko_bit: {
                gte: today.toDate(),
                lte: thirtyDaysLater.toDate(),
              },
            },
          }),

          // Kasko süresi geçmiş
          prisma.araclar.count({
            where: {
              kasko_bit: {
                lt: today.toDate(),
              },
            },
          }),

          // Kurum bazında dağılım
          prisma.araclar.groupBy({
            by: ["kurum"],
            _count: {
              id: true,
            },
          }),
        ]);

        return NextResponse.json({
          data: {
            toplamArac,
            muayene: {
              yaklasan: muayeneSuresiYaklasan,
              gecmis: muayeneSuresiGecmis,
            },
            sigorta: {
              yaklasan: sigortaSuresiYaklasan,
              gecmis: sigortaSuresiGecmis,
            },
            kasko: {
              yaklasan: kaskoSuresiYaklasan,
              gecmis: kaskoSuresiGecmis,
            },
            kurumDagilimi: kurumBazinda.map((k: any) => ({
              kurum: k.kurum || "Belirtilmemiş",
              adet: k._count.id,
            })),
          },
        });
      }

      case "yaklasan-islemler": {
        // 30 gün içinde yapılması gereken işlemler
        const araclar = await prisma.araclar.findMany({
          where: {
            OR: [
              {
                muayene_bit: {
                  gte: today.toDate(),
                  lte: thirtyDaysLater.toDate(),
                },
              },
              {
                sigorta_bit: {
                  gte: today.toDate(),
                  lte: thirtyDaysLater.toDate(),
                },
              },
              {
                kasko_bit: {
                  gte: today.toDate(),
                  lte: thirtyDaysLater.toDate(),
                },
              },
            ],
          },
          select: {
            id: true,
            plaka: true,
            marka: true,
            model: true,
            kurum: true,
            muayene_bit: true,
            sigorta_bit: true,
            kasko_bit: true,
          },
        });

        const yaklasamIslemler = araclar.map((arac: any) => {
          const islemler: string[] = [];

          const muayeneBit = arac.muayene_bit ? dayjs(arac.muayene_bit) : null;
          const sigortaBit = arac.sigorta_bit ? dayjs(arac.sigorta_bit) : null;
          const kaskoBit = arac.kasko_bit ? dayjs(arac.kasko_bit) : null;

          if (
            muayeneBit &&
            !muayeneBit.isBefore(today) &&
            !muayeneBit.isAfter(thirtyDaysLater)
          ) {
            islemler.push(`Muayene (${muayeneBit.format("YYYY-MM-DD")})`);
          }

          if (
            sigortaBit &&
            !sigortaBit.isBefore(today) &&
            !sigortaBit.isAfter(thirtyDaysLater)
          ) {
            islemler.push(`Sigorta (${sigortaBit.format("YYYY-MM-DD")})`);
          }

          if (
            kaskoBit &&
            !kaskoBit.isBefore(today) &&
            !kaskoBit.isAfter(thirtyDaysLater)
          ) {
            islemler.push(`Kasko (${kaskoBit.format("YYYY-MM-DD")})`);
          }

          return {
            ...arac,
            yaklasamIslemler: islemler,
          };
        });

        return NextResponse.json({
          data: yaklasamIslemler,
        });
      }

      case "gecmis-islemler": {
        // Süresi geçmiş işlemler
        const araclar = await prisma.araclar.findMany({
          where: {
            OR: [
              {
                muayene_bit: {
                  lt: today.toDate(),
                },
              },
              {
                sigorta_bit: {
                  lt: today.toDate(),
                },
              },
              {
                kasko_bit: {
                  lt: today.toDate(),
                },
              },
            ],
          },
          select: {
            id: true,
            plaka: true,
            marka: true,
            model: true,
            kurum: true,
            muayene_bit: true,
            sigorta_bit: true,
            kasko_bit: true,
          },
        });

        const gecmisIslemler = araclar.map((arac: any) => {
          const islemler: string[] = [];

          if (arac.muayene_bit && dayjs(arac.muayene_bit).isBefore(today)) {
            const gunFarki = today.diff(dayjs(arac.muayene_bit), "day");
            islemler.push(`Muayene (${gunFarki} gün gecikmiş)`);
          }

          if (arac.sigorta_bit && dayjs(arac.sigorta_bit).isBefore(today)) {
            const gunFarki = today.diff(dayjs(arac.sigorta_bit), "day");
            islemler.push(`Sigorta (${gunFarki} gün gecikmiş)`);
          }

          if (arac.kasko_bit && dayjs(arac.kasko_bit).isBefore(today)) {
            const gunFarki = today.diff(dayjs(arac.kasko_bit), "day");
            islemler.push(`Kasko (${gunFarki} gün gecikmiş)`);
          }

          return {
            ...arac,
            gecmisIslemler: islemler,
          };
        });

        return NextResponse.json({
          data: gecmisIslemler,
        });
      }

      case "bakim-plani": {
        // Bakım planlama raporu
        const araclar = await prisma.araclar.findMany({
          select: {
            id: true,
            plaka: true,
            marka: true,
            model: true,
            kurum: true,
            bakim_son: true,
            bakim_son_km: true,
            bakim_sonraki: true,
            bakim_sonraki_km: true,
            periyodik_bakim_tarih: true,
            periyodik_bakim_km: true,
            agir_bakim_tarih: true,
            agir_bakim_km: true,
          },
        });

        return NextResponse.json({
          data: araclar,
        });
      }

      default:
        return NextResponse.json(
          { error: "Geçersiz rapor türü" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Araç Rapor Error:", error);
    return NextResponse.json(
      { error: "Rapor oluşturulamadı" },
      { status: 500 }
    );
  }
}
