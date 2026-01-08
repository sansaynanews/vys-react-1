import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const muhtarSchema = z.object({
  ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
  ilce: z.string().optional(),
  mahalle_koy: z.string().min(1, "Mahalle/Köy gerekli"),
  gsm: z.string().min(1, "GSM gerekli"), // Muhtar için GSM önemli
  sabit_tel: z.string().optional(),
  email: z.string().email("Geçerli bir email giriniz").optional().or(z.literal("")),
  foto: z.string().optional(),
});

// GET - List
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const ilce = searchParams.get("ilce");

    const where: any = {};

    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { mahalle_koy: { contains: search } },
      ];
    }

    if (ilce) {
      where.ilce = { equals: ilce };
    }

    const muhtarlar = await prisma.muhtarlar.findMany({
      where,
      orderBy: [
        { ilce: "asc" },
        { mahalle_koy: "asc" }
      ],
    });

    return NextResponse.json({ data: muhtarlar });
  } catch (error) {
    console.error("Muhtar GET Error:", error);
    return NextResponse.json(
      { error: "Liste getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Create
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = muhtarSchema.parse(body);

    const muhtar = await prisma.muhtarlar.create({
      data: validated,
    });

    return NextResponse.json({
      message: "Kayıt başarıyla oluşturuldu",
      data: muhtar,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Muhtar POST Error:", error);
    return NextResponse.json(
      { error: "Kayıt oluşturulamadı" },
      { status: 500 }
    );
  }
}
