import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const protokolSchema = z.object({
  sira_no: z.preprocess((val) => Number(val), z.number().min(1).default(999)),
  ad_soyad: z.string().min(1, "Ad Soyad gerekli"),
  unvan: z.string().optional(),
  kurum: z.string().optional(),
  telefon: z.string().optional(),
  eposta: z.string().email().optional().or(z.literal("")),
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

    const where: any = {};
    if (search) {
      where.OR = [
        { ad_soyad: { contains: search } },
        { kurum: { contains: search } },
        { unvan: { contains: search } },
      ];
    }

    const items = await prisma.protokol_listesi.findMany({
      where,
      orderBy: { sira_no: "asc" },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Protokol GET Error:", error);
    return NextResponse.json({ error: "Liste getirilemedi" }, { status: 500 });
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
    const validated = protokolSchema.parse(body);

    const item = await prisma.protokol_listesi.create({
      data: validated,
    });

    return NextResponse.json({
      message: "Protokol üyesi eklendi",
      data: item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
