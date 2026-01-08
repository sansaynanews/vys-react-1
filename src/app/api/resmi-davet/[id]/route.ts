import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const resmiDavetSchema = z.object({
  tur: z.string().min(1, "Davet türü gerekli"),
  sahip: z.string().min(1, "Davet sahibi gerekli"),
  tarih: z.string().optional(),
  saat: z.string().optional(),
  yer: z.string().optional(),
  aciklama: z.string().optional(),
  getiren: z.string().optional(),
  gelis_sekli: z.string().optional(),
  iletisim: z.string().optional(),
  gelis_tarih: z.string().optional(),
  gelis_saat: z.string().optional(),
  katilim_durumu: z.string().optional(),
});

// GET - Tekil resmi davet
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

    const davet = await prisma.resmi_davetler.findUnique({
      where: { id },
    });

    if (!davet) {
      return NextResponse.json({ error: "Resmi davet bulunamadı" }, { status: 404 });
    }

    const formattedDavet = {
      ...davet,
      tarih: davet.tarih ? dayjs(davet.tarih).format("YYYY-MM-DD") : null,
      gelis_tarih: davet.gelis_tarih ? dayjs(davet.gelis_tarih).format("YYYY-MM-DD") : null,
      created_at: davet.created_at ? dayjs(davet.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
    };

    return NextResponse.json(formattedDavet);
  } catch (error) {
    console.error("Resmi Davet GET Error:", error);
    return NextResponse.json(
      { error: "Resmi davet getirilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Resmi davet güncelle
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
    const validated = resmiDavetSchema.parse(body);

    await prisma.resmi_davetler.update({
      where: { id },
      data: {
        tur: validated.tur,
        sahip: validated.sahip,
        tarih: validated.tarih ? new Date(validated.tarih) : null,
        saat: validated.saat || null,
        yer: validated.yer || null,
        aciklama: validated.aciklama || null,
        getiren: validated.getiren || null,
        gelis_sekli: validated.gelis_sekli || null,
        iletisim: validated.iletisim || null,
        gelis_tarih: validated.gelis_tarih ? new Date(validated.gelis_tarih) : null,
        gelis_saat: validated.gelis_saat || null,
        katilim_durumu: validated.katilim_durumu || "Belirsiz",
      },
    });

    return NextResponse.json({
      message: "Resmi davet başarıyla güncellendi",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Resmi Davet PUT Error:", error);
    return NextResponse.json(
      { error: "Resmi davet güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Resmi davet sil
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

    await prisma.resmi_davetler.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Resmi davet başarıyla silindi",
    });
  } catch (error) {
    console.error("Resmi Davet DELETE Error:", error);
    return NextResponse.json(
      { error: "Resmi davet silinemedi" },
      { status: 500 }
    );
  }
}
