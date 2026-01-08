import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

// Validation schema
const rehberSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  unvan: z.string().optional(),
  kurum: z.string().optional(),
  telefon: z.string().min(1, "Telefon gerekli"),
  telefon2: z.string().optional(),
  dahili: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  adres: z.string().optional(),
  aciklama: z.string().optional(),
});

// GET - Rehber listesi
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const islem = searchParams.get("islem") || "liste";

    if (islem === "liste") {
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const search = searchParams.get("search") || "";
      const kurum = searchParams.get("kurum") || "";

      const skip = (page - 1) * limit;

      // Filtreler
      const where: any = {};

      if (search) {
        where.OR = [
          { ad_soyad: { contains: search } },
          { unvan: { contains: search } },
          { kurum: { contains: search } },
          { telefon: { contains: search } },
          { dahili: { contains: search } },
          { email: { contains: search } },
        ];
      }

      if (kurum && kurum !== "Tümü") {
        where.kurum = kurum;
      }

      const [rehberler, total] = await Promise.all([
        prisma.rehber.findMany({
          where,
          orderBy: [
            { kurum: "asc" },
            { ad_soyad: "asc" },
          ],
          skip,
          take: limit,
        }),
        prisma.rehber.count({ where }),
      ]);

      // Tarihleri formatla
      const formattedRehberler = rehberler.map((kisi: any) => ({
        ...kisi,
        created_at: kisi.created_at ? dayjs(kisi.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
      }));

      return NextResponse.json({
        status: "success",
        data: formattedRehberler,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } else if (islem === "kurum_listesi") {
      const kurumlar = await prisma.rehber.findMany({
        where: {
          kurum: {
            not: null,
          },
        },
        select: {
          kurum: true,
        },
        distinct: ["kurum"],
        orderBy: {
          kurum: "asc",
        },
      });

      return NextResponse.json(kurumlar.map((k: any) => k.kurum).filter((k: any) => k));
    } else if (islem === "istatistik") {
      const [toplamKayit, kurumlar] = await Promise.all([
        prisma.rehber.count(),
        prisma.rehber.findMany({
          where: {
            kurum: {
              not: null,
            },
          },
          select: {
            kurum: true,
          },
          distinct: ["kurum"],
        }),
      ]);

      return NextResponse.json({
        toplam_kayit: toplamKayit,
        toplam_kurum: kurumlar.filter((k: any) => k.kurum).length,
      });
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error) {
    console.error("Rehber GET Error:", error);
    return NextResponse.json(
      { error: "Rehber getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Kaydet veya Güncelle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const id = body.id;

    // ID varsa update, yoksa create
    if (id) {
      const validated = rehberSchema.parse(body);

      await prisma.rehber.update({
        where: { id: parseInt(id) },
        data: {
          ad_soyad: validated.ad_soyad,
          unvan: validated.unvan || null,
          kurum: validated.kurum || null,
          telefon: validated.telefon,
          telefon2: validated.telefon2 || null,
          dahili: validated.dahili || null,
          email: validated.email || null,
          adres: validated.adres || null,
          aciklama: validated.aciklama || null,
        },
      });

      return NextResponse.json({
        status: "success",
        message: "Güncellendi"
      });
    } else {
      const validated = rehberSchema.parse(body);

      await prisma.rehber.create({
        data: {
          ad_soyad: validated.ad_soyad,
          unvan: validated.unvan || null,
          kurum: validated.kurum || null,
          telefon: validated.telefon,
          telefon2: validated.telefon2 || null,
          dahili: validated.dahili || null,
          email: validated.email || null,
          adres: validated.adres || null,
          aciklama: validated.aciklama || null,
        },
      });

      return NextResponse.json({
        status: "success",
        message: "Eklendi"
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Rehber POST Error:", error);
    return NextResponse.json(
      { error: "İşlem başarısız" },
      { status: 500 }
    );
  }
}

// DELETE - Sil
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await prisma.rehber.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      status: "success",
      message: "Silindi"
    });
  } catch (error) {
    console.error("Rehber DELETE Error:", error);
    return NextResponse.json(
      { error: "Silinemedi" },
      { status: 500 }
    );
  }
}
