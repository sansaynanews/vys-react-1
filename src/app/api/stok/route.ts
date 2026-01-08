import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const stokSchema = z.object({
  adi: z.string().min(1, "Stok adı gerekli"),
  cesit: z.string().min(1, "Çeşit/Model gerekli"),
  kategori: z.string().optional().default("Genel"),
  tur: z.string().optional().default("genel"),
  miktar: z.preprocess((val) => Number(val), z.number().optional().default(0)),
});

// GET - Stok Listesi
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori");

    const where: any = {};

    if (search) {
      where.OR = [
        { adi: { contains: search } },
        { cesit: { contains: search } },
      ];
    }

    if (kategori) {
      where.kategori = { equals: kategori };
    }

    const stoklar = await prisma.stok_kartlari.findMany({
      where,
      orderBy: { adi: "asc" },
    });

    return NextResponse.json({ data: stoklar });
  } catch (error) {
    console.error("Stok GET Error:", error);
    return NextResponse.json(
      { error: "Stok listesi getirilemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni Stok Kartı
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validated = stokSchema.parse(body);

    const stok = await prisma.stok_kartlari.create({
      data: validated,
    });

    return NextResponse.json({
      message: "Stok kartı oluşturuldu",
      data: stok,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Stok POST Error:", error);
    return NextResponse.json(
      { error: "Stok kartı oluşturulamadı" },
      { status: 500 }
    );
  }
}
