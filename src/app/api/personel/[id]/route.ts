import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";

const personelUpdateSchema = z.object({
  ad_soyad: z.string().min(1).optional(),
  birim: z.string().min(1).optional(),
  unvan: z.string().optional(),
  telefon: z.string().optional(),
  eposta: z.string().email().optional().or(z.literal("")),
  acil_kisi: z.string().optional(),
  acil_tel: z.string().optional(),
  kan_grubu: z.string().optional(),
  baslama_tarihi: z.string().optional(),
  yabanci_dil: z.string().optional(),
  gorev_tanimi: z.string().optional(),
  aciklama: z.string().optional(),
  toplam_izin: z.number().optional(),
  kullanilan_izin: z.number().optional(),
  mesai_saati: z.number().optional(),
  rapor_gun: z.number().optional(),
});

// GET - Tekil Personel
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

    const personel = await prisma.personeller.findUnique({
      where: { id },
    });

    if (!personel || personel.silindi) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
    }

    const formattedPersonel = {
      ...personel,
      baslama_tarihi: personel.baslama_tarihi ? dayjs(personel.baslama_tarihi).format("YYYY-MM-DD") : null,
    };

    return NextResponse.json({ data: formattedPersonel });
  } catch (error) {
    console.error("Personel GET Error:", error);
    return NextResponse.json(
      { error: "Personel bilgileri getirilemedi" },
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
    const validated = personelUpdateSchema.parse(body);

    const data: any = { ...validated };

    if (data.baslama_tarihi) {
      data.baslama_tarihi = new Date(data.baslama_tarihi);
    }

    const personel = await prisma.personeller.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: "Personel başarıyla güncellendi",
      data: personel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Personel PUT Error:", error);
    return NextResponse.json(
      { error: "Personel güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Silme (Soft Delete)
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

    // Soft delete: silindi=true, silinme_tarihi=now
    await prisma.personeller.update({
      where: { id },
      data: {
        silindi: true,
        silinme_tarihi: new Date(),
      }
    });

    return NextResponse.json({ message: "Personel başarıyla silindi" });
  } catch (error) {
    console.error("Personel DELETE Error:", error);
    return NextResponse.json(
      { error: "Personel silinemedi" },
      { status: 500 }
    );
  }
}
