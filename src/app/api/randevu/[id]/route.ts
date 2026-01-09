import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import dayjs from "dayjs";
import { notifyAppointmentUpdated } from "@/lib/notifications";
import { APPOINTMENT_STATUS } from "@/lib/constants";

const randevuUpdateSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli").optional(),
  kurum: z.string().min(1, "Kurum gerekli").optional(),
  unvan: z.string().optional(),
  iletisim: z.string().optional(),
  amac: z.string().optional(),
  tarih: z.string().optional(),
  saat: z.string().optional(),
  durum: z.string().optional(),
  notlar: z.string().optional(),
  sonuc_notlari: z.string().optional(),
  talep_kaynagi: z.string().optional(),
  katilimci: z.number().optional(),
  // İş Akışı alanları
  yonlendirilen_birim: z.string().optional(),
  yonlendirme_nedeni: z.string().optional(),
  ret_gerekcesi: z.string().optional(),
  havale_edilen: z.string().optional(),
  havale_nedeni: z.string().optional(),
  iptal_gerekcesi: z.string().optional(),
  hediye_notu: z.string().optional(),
  arac_plaka: z.string().optional(),
  // Süre takibi alanları
  giris_saati: z.string().optional(),
  gorusme_baslangic: z.string().optional(),
  cikis_saati: z.string().optional(),
  giris_tarihi: z.string().optional(),
});

// GET - Tekil randevu
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
    const randevu = await prisma.randevular.findUnique({
      where: { id },
    });

    if (!randevu) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...randevu,
        tarih: randevu.tarih ? dayjs(randevu.tarih).format("YYYY-MM-DD") : null,
      },
    });
  } catch (error) {
    console.error("Randevu GET Error:", error);
    return NextResponse.json(
      { error: "Randevu getirilemedi" },
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
    const validated = randevuUpdateSchema.parse(body);

    // Mevcut kontrolü
    const existing = await prisma.randevular.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    // Tarih çakışma kontrolü (eğer tarih/saat değişiyorsa)
    if (validated.tarih && validated.saat) {
      const conflict = await prisma.randevular.findFirst({
        where: {
          id: { not: id },
          tarih: new Date(validated.tarih),
          saat: validated.saat,
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "Bu tarih ve saatte başka bir randevu var" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validated.ad_soyad) updateData.ad_soyad = validated.ad_soyad;
    if (validated.kurum) updateData.kurum = validated.kurum;
    if (validated.unvan !== undefined) updateData.unvan = validated.unvan;
    if (validated.iletisim !== undefined) updateData.iletisim = validated.iletisim;
    if (validated.amac !== undefined) updateData.amac = validated.amac;
    if (validated.tarih) updateData.tarih = new Date(validated.tarih);
    if (validated.saat) updateData.saat = validated.saat;
    if (validated.durum) updateData.durum = validated.durum;
    if (validated.notlar !== undefined) updateData.notlar = validated.notlar;
    if (validated.katilimci !== undefined) updateData.katilimci = validated.katilimci;
    if (validated.sonuc_notlari !== undefined) updateData.sonuc_notlari = validated.sonuc_notlari;
    if (validated.talep_kaynagi !== undefined) updateData.talep_kaynagi = validated.talep_kaynagi;
    // İş Akışı alanları
    if (validated.yonlendirilen_birim !== undefined) updateData.yonlendirilen_birim = validated.yonlendirilen_birim;
    if (validated.yonlendirme_nedeni !== undefined) updateData.yonlendirme_nedeni = validated.yonlendirme_nedeni;
    if (validated.ret_gerekcesi !== undefined) updateData.ret_gerekcesi = validated.ret_gerekcesi;
    if (validated.havale_edilen !== undefined) updateData.havale_edilen = validated.havale_edilen;
    if (validated.havale_nedeni !== undefined) updateData.havale_nedeni = validated.havale_nedeni;
    if (validated.iptal_gerekcesi !== undefined) updateData.iptal_gerekcesi = validated.iptal_gerekcesi;
    if (validated.hediye_notu !== undefined) updateData.hediye_notu = validated.hediye_notu;
    if (validated.arac_plaka !== undefined) updateData.arac_plaka = validated.arac_plaka;
    // Süre takibi alanları
    if (validated.giris_saati !== undefined) updateData.giris_saati = validated.giris_saati;
    if (validated.gorusme_baslangic !== undefined) updateData.gorusme_baslangic = validated.gorusme_baslangic;
    if (validated.cikis_saati !== undefined) updateData.cikis_saati = validated.cikis_saati;
    if (validated.giris_tarihi !== undefined) updateData.giris_tarihi = validated.giris_tarihi ? new Date(validated.giris_tarihi) : null;

    const randevu = await prisma.randevular.update({
      where: { id },
      data: updateData,
    });

    // Otomatik Talimat Oluşturma (Yönlendirme Durumlarında)
    if (validated.durum &&
      (validated.durum === APPOINTMENT_STATUS.DELEGATED_UNIT.id ||
        validated.durum === APPOINTMENT_STATUS.DELEGATED_SUB.id)) {

      const targetUnit = randevu.yonlendirilen_birim || randevu.havale_edilen;
      if (targetUnit) {
        await prisma.talimatlar.create({
          data: {
            konu: `Yönlendirme: ${randevu.ad_soyad || ""} - ${randevu.amac || "Randevu Talebi"}`,
            verilen_kisi: "Vali",
            kurum: targetUnit,
            icerik: (validated.notlar || "") + "\n\n(Bu talimat randevu sisteminden otomatik oluşturulmuştur.)",
            durum: "Beklemede",
            tarih: new Date(),
            randevu_id: randevu.id,
            onem_derecesi: "Normal"
          }
        });
      }
    }

    // Eğer Yönlendirme durumu kaldırıldıysa (Örn: Onaylandı olduysa), ilgili talimatı sil
    if (validated.durum &&
      ![APPOINTMENT_STATUS.DELEGATED_UNIT.id, APPOINTMENT_STATUS.DELEGATED_SUB.id].includes(validated.durum as any)) {
      await prisma.talimatlar.deleteMany({
        where: { randevu_id: Number(id) }
      });
    }

    // Send Notification if status changed or just update info
    // Only if status explicitly changed or rescheduled (which also changes status usually)
    if (validated.durum) {
      notifyAppointmentUpdated(randevu, randevu.durum || "").catch(e => console.error(e));
    }

    return NextResponse.json({
      message: "Randevu başarıyla güncellendi",
      data: {
        ...randevu,
        tarih: randevu.tarih ? dayjs(randevu.tarih).format("YYYY-MM-DD") : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Randevu PUT Error:", error);
    return NextResponse.json(
      { error: "Randevu güncellenemedi" },
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

    const existing = await prisma.randevular.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.randevular.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Randevu başarıyla silindi",
    });
  } catch (error) {
    console.error("Randevu DELETE Error:", error);
    return NextResponse.json(
      { error: "Randevu silinemedi" },
      { status: 500 }
    );
  }
}
