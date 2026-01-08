import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const programSchema = z.object({
  tarih: z.string().min(1, "Tarih gerekli"), // YYYY-MM-DD
  saat: z.string().min(1, "Saat gerekli"),
  tur: z.string().optional(),
  aciklama: z.string().min(1, "Açıklama gerekli"),
});

// GET - List
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || dayjs().format("YYYY-MM-DD");

    const items = await prisma.gunluk_program_manuel.findMany({
      where: {
        tarih: new Date(date),
      },
      orderBy: { saat: "asc" },
    });

    return NextResponse.json({
      data: items.map(item => ({
        ...item,
        tarih: dayjs(item.tarih).format("YYYY-MM-DD"),
      }))
    });
  } catch (error) {
    console.error("Program GET Error:", error);
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
    const validated = programSchema.parse(body);

    const item = await prisma.gunluk_program_manuel.create({
      data: {
        ...validated,
        tarih: new Date(validated.tarih),
      },
    });

    return NextResponse.json({
      message: "Program eklendi",
      data: item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
