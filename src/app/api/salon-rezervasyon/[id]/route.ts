import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const rezervasyonUpdateSchema = z.object({
  salon_id: z.number().optional(),
  baslik: z.string().min(1).optional(),
  tur: z.string().optional(),
  rez_sahibi: z.string().optional(),
  departman: z.string().optional(),
  iletisim: z.string().optional(),
  tarih: z.string().optional(),
  bas_saat: z.string().optional(),
  bit_saat: z.string().optional(),
  kararlar: z.string().optional(),
});

async function checkConflict(salonId: number, tarihStr: string, basSaat: string, bitSaat: string, excludeId?: number) {
  const existing = await prisma.salon_rezervasyonlari.findMany({
    where: {
      salon_id: salonId,
      tarih: new Date(tarihStr),
      id: excludeId ? { not: excludeId } : undefined,
    },
  });

  return existing.some((rez) => {
    const dbBas = rez.bas_saat || "00:00";
    const dbBit = rez.bit_saat || "23:59";
    return (dbBas < bitSaat) && (dbBit > basSaat);
  });
}

// GET - Tekil
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    const rez = await prisma.salon_rezervasyonlari.findUnique({
      where: { id },
    });

    if (!rez) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...rez,
        tarih: rez.tarih ? dayjs(rez.tarih).format("YYYY-MM-DD") : null
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "İşlem başarısız" },
      { status: 500 }
    );
  }
}

// PUT - Güncelleme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();
    const validated = rezervasyonUpdateSchema.parse(body);

    // Eğer tarih/saat veya salon değişiyorsa çakışma kontrolü yap
    // Bunu tam yapabilmek için önce mevcut kaydı çekip, değişmeyen alanları onunla birleştirmek gerekir
    // Basitlik adina: Eğer kritik alanlar validasyondan geldiyse kontrol edelim.

    if (validated.salon_id || validated.tarih || validated.bas_saat || validated.bit_saat) {
      // Mevcut kaydı çek
      const available = await prisma.salon_rezervasyonlari.findUnique({ where: { id } });
      if (!available) return NextResponse.json({ error: "Kayıt yok" }, { status: 404 });

      const targetSalon = validated.salon_id || available.salon_id;
      const targetTarih = validated.tarih || dayjs(available.tarih).format("YYYY-MM-DD");
      const targetBas = validated.bas_saat || available.bas_saat || "00:00";
      const targetBit = validated.bit_saat || available.bit_saat || "23:59";

      const hasConflict = await checkConflict(targetSalon, targetTarih, targetBas, targetBit, id);
      if (hasConflict) {
        return NextResponse.json({ error: "Güncelleme başarısız: Çakışma var!" }, { status: 409 });
      }
    }

    const data: any = { ...validated };
    if (data.tarih) {
      data.tarih = new Date(data.tarih);
    }

    // Salon adı güncelleme gerekebilir
    if (validated.salon_id) {
      const s = await prisma.toplanti_salonlari.findUnique({ where: { id: validated.salon_id }, select: { ad: true } });
      if (s) data.salon_ad = s.ad;
    }

    const updated = await prisma.salon_rezervasyonlari.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: "Rezervasyon güncellendi",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Güncelleme başarısız" },
      { status: 500 }
    );
  }
}

// DELETE - Silme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);

    await prisma.salon_rezervasyonlari.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Rezervasyon silindi" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Silme başarısız" },
      { status: 500 }
    );
  }
}
