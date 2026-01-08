import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const hareketSchema = z.object({
  stok_id: z.number().min(1, "Stok seçimi gerekli"),
  tur: z.enum(["Giriş", "Çıkış"]),
  miktar: z.preprocess((val) => Number(val), z.number().min(1, "Miktar en az 1 olmalı")),
  kisi: z.string().optional(), // 'alinan' veya 'verilen' alanına map edilecek
  tarih: z.string().optional(),
});

// GET - Hareket Listesi
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // stok_hareketleri tablosunda stok_id yok, isimlendirme üzerinden gidilmiş eski sistemde.
    // Ancak biz stok kartı adıyla eşleştirme yapabiliriz veya sadece genel listeyi döndürebiliriz.
    // Yeni sistemde, stok_id üzerinden veri çekmek istersek şemayı güncellememiz gerekirdi ama
    // mevcut şemaya sadık kalarak, isim ile filtreleme yapacağız.

    const where: any = {};
    if (search) {
      where.OR = [
        { adi: { contains: search } },
        { cesit: { contains: search } },
        { alinan: { contains: search } },
        { verilen: { contains: search } },
      ];
    }

    const hareketler = await prisma.stok_hareketleri.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return NextResponse.json({
      data: hareketler.map(h => ({
        ...h,
        tarih: h.tarih // Zaten string formatında db'de
      }))
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Hareketler getirilemedi" }, { status: 500 });
  }
}

// POST - Yeni Hareket (Transaction)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = hareketSchema.parse(body);

    const { stok_id, tur, miktar, kisi, tarih } = validated;

    // Transaction başlat
    const result = await prisma.$transaction(async (tx) => {
      // 1. Stok kartını bul
      const stok = await tx.stok_kartlari.findUnique({
        where: { id: stok_id }
      });

      if (!stok) {
        throw new Error("Stok kartı bulunamadı");
      }

      // 2. Miktar kontrol ve güncelleme
      let yeniMiktar = stok.miktar || 0;

      if (tur === "Çıkış") {
        if (yeniMiktar < miktar) {
          throw new Error(`Yetersiz stok! Mevcut: ${yeniMiktar}`);
        }
        yeniMiktar -= miktar;
      } else {
        yeniMiktar += miktar;
      }

      // Stok kartını güncelle
      await tx.stok_kartlari.update({
        where: { id: stok_id },
        data: { miktar: yeniMiktar }
      });

      // 3. Hareket kaydı oluştur
      // Eski schema uyumluluğu: adi, cesit, etc.
      const hareket = await tx.stok_hareketleri.create({
        data: {
          Adi: stok.adi, // Prisma model field names are case sensitive? Let's check schema.
          // Schema: adi lower case.
          adi: stok.adi,
          cesit: stok.cesit,
          tur: tur,
          miktar: miktar,
          kalan_stok: yeniMiktar,
          tarih: tarih || dayjs().format("DD.MM.YYYY"),
          alinan: tur === "Giriş" ? (kisi || "-") : "-",
          verilen: tur === "Çıkış" ? (kisi || "-") : "-",
          personel: session.user?.name || "Sistem",
          stok_turu: stok.tur || "genel"
        }
      });

      return hareket;
    });

    return NextResponse.json({
      message: "Hareket başarıyla işlendi",
      data: result
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
    }
    // Custom Errors
    if (error.message.includes("Yetersiz stok") || error.message.includes("Stok kartı")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Hareket POST Error:", error);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
