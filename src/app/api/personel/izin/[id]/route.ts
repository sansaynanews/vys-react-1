import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const izinUpdateSchema = z.object({
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

// GET - Tek izin kaydı
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

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const izin = await prisma.personel_izinleri.findUnique({
      where: { id },
    });

    if (!izin) {
      return NextResponse.json({ error: "İzin kaydı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ data: izin });
  } catch (error) {
    console.error("İzin GET Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı getirilemedi" },
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

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = izinUpdateSchema.parse(body);

    // Mevcut kaydı getir
    const existing = await prisma.personel_izinleri.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "İzin kaydı bulunamadı" }, { status: 404 });
    }

    // Personel bilgilerini getir
    const personel = await prisma.personeller.findUnique({
      where: { id: validated.personel_id },
    });

    if (!personel) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
    }

    // Eski ve yeni izin günlerini hesapla
    const eskiBaslangic = dayjs(existing.baslangic);
    const eskiBitis = dayjs(existing.bitis);
    const eskiIzinGunu = eskiBitis.diff(eskiBaslangic, "day") + 1;

    const yeniBaslangic = dayjs(validated.baslangic);
    const yeniBitis = dayjs(validated.bitis);
    const yeniIzinGunu = yeniBitis.diff(yeniBaslangic, "day") + 1;

    const fark = yeniIzinGunu - eskiIzinGunu;

    // Yıllık izin kontrolü ve güncelleme
    if (validated.turu === "Yıllık İzin" && existing.turu === "Yıllık İzin") {
      if (fark !== 0) {
        const yeniKullanilanIzin = (personel.kullanilan_izin || 0) + fark;
        const kalanIzin = (personel.toplam_izin || 14) - yeniKullanilanIzin;

        if (kalanIzin < 0) {
          return NextResponse.json(
            { error: `Yetersiz izin hakkı. Kalan izin: ${(personel.toplam_izin || 14) - (personel.kullanilan_izin || 0)} gün` },
            { status: 400 }
          );
        }

        await prisma.personeller.update({
          where: { id: validated.personel_id },
          data: {
            kullanilan_izin: yeniKullanilanIzin,
          },
        });
      }
    } else if (validated.turu === "Yıllık İzin" && existing.turu !== "Yıllık İzin") {
      // Türü yıllık izne çeviriyorsa
      const yeniKullanilanIzin = (personel.kullanilan_izin || 0) + yeniIzinGunu;
      const kalanIzin = (personel.toplam_izin || 14) - yeniKullanilanIzin;

      if (kalanIzin < 0) {
        return NextResponse.json(
          { error: `Yetersiz izin hakkı. Kalan izin: ${(personel.toplam_izin || 14) - (personel.kullanilan_izin || 0)} gün` },
          { status: 400 }
        );
      }

      await prisma.personeller.update({
        where: { id: validated.personel_id },
        data: {
          kullanilan_izin: yeniKullanilanIzin,
        },
      });
    } else if (validated.turu !== "Yıllık İzin" && existing.turu === "Yıllık İzin") {
      // Türü yıllık izinden başka bir şeye çeviriyorsa
      await prisma.personeller.update({
        where: { id: validated.personel_id },
        data: {
          kullanilan_izin: Math.max(0, (personel.kullanilan_izin || 0) - eskiIzinGunu),
        },
      });
    }

    const izin = await prisma.personel_izinleri.update({
      where: { id },
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
      message: "İzin kaydı başarıyla güncellendi",
      data: izin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("İzin PUT Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı güncellenemedi" },
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

    if (isNaN(id)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    // Kaydı getir
    const existing = await prisma.personel_izinleri.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "İzin kaydı bulunamadı" }, { status: 404 });
    }

    // Yıllık izin ise kullanılan izni geri al
    if (existing.turu === "Yıllık İzin") {
      const personel = await prisma.personeller.findUnique({
        where: { id: existing.personel_id },
      });

      if (personel) {
        const baslangic = dayjs(existing.baslangic);
        const bitis = dayjs(existing.bitis);
        const izinGunu = bitis.diff(baslangic, "day") + 1;

        await prisma.personeller.update({
          where: { id: existing.personel_id },
          data: {
            kullanilan_izin: Math.max(0, (personel.kullanilan_izin || 0) - izinGunu),
          },
        });
      }
    }

    await prisma.personel_izinleri.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "İzin kaydı başarıyla silindi",
    });
  } catch (error) {
    console.error("İzin DELETE Error:", error);
    return NextResponse.json(
      { error: "İzin kaydı silinemedi" },
      { status: 500 }
    );
  }
}
