import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/tr";

dayjs.extend(relativeTime);
dayjs.locale("tr");

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Yetkisiz erişim" },
        { status: 401 }
      );
    }

    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

    // Bugünkü randevular
    const todayAppointments = await prisma.randevular.count({
      where: {
        tarih: new Date(today),
      },
    });

    // Yarınki randevular
    const tomorrowAppointments = await prisma.randevular.count({
      where: {
        tarih: new Date(tomorrow),
      },
    });

    // Bugünkü toplantılar - şimdilik 0
    const todayMeetings = 0;

    // Yarınki toplantılar - şimdilik 0
    const tomorrowMeetings = 0;

    // Aktif araç görevleri (bugün)
    const activeVehicles = await prisma.araclar.count();

    // İzindeki personeller
    const onLeavePersonnel = await prisma.personel_izinleri.count({
      where: {
        baslangic: {
          lte: new Date(today),
        },
        bitis: {
          gte: new Date(today),
        },
      },
    });

    // Bekleyen evraklar (son 7 gün)
    const weekAgo = dayjs().subtract(7, "day").format("YYYY-MM-DD");
    const pendingDocuments = await prisma.evraklar.count({
      where: {
        created_at: {
          gte: new Date(weekAgo),
        },
      },
    });

    // Yaklaşan randevular (bugün ve yarın)
    const upcomingAppointments = await prisma.randevular.findMany({
      where: {
        tarih: {
          gte: new Date(today),
          lte: new Date(tomorrow),
        },
      },
      select: {
        id: true,
        tarih: true,
        saat: true,
        ad_soyad: true,
        kurum: true,
        durum: true,
      },
      orderBy: [
        { tarih: "asc" },
        { saat: "asc" },
      ],
      take: 5,
    });

    // Yaklaşan toplantılar - şimdilik boş
    const upcomingMeetings: any[] = [];

    // Son aktiviteler
    const recentRandevular = await prisma.randevular.findMany({
      select: {
        id: true,
        ad_soyad: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 5,
    });

    const recentToplanti: any[] = [];

    return NextResponse.json({
      stats: {
        todayAppointments,
        tomorrowAppointments,
        todayMeetings,
        tomorrowMeetings,
        activeVehicles,
        onLeavePersonnel,
        pendingDocuments,
      },
      upcomingAppointments: upcomingAppointments.map((app: any) => ({
        id: app.id,
        title: `${app.ad_soyad} - ${app.kurum}`,
        date: dayjs(app.tarih).format("YYYY-MM-DD"),
        time: app.saat || "",
        type: "Randevu",
        status: app.durum || "Bekliyor",
      })),
      upcomingMeetings: upcomingMeetings.map((meeting: any) => ({
        id: meeting.id,
        title: meeting.konu || "Toplantı",
        date: dayjs(meeting.tarih).format("YYYY-MM-DD"),
        time: meeting.baslangic_saat || "",
        type: "Toplantı",
        status: meeting.durum || "Planlandı",
      })),
      recentActivities: [
        ...recentRandevular.map((r: any) => ({
          type: "randevu",
          action: `Yeni randevu: ${r.ad_soyad}`,
          time: dayjs(r.created_at).fromNow(),
          timestamp: r.created_at,
        })),
        ...recentToplanti.map((t: any) => ({
          type: "toplanti",
          action: `Yeni toplantı: ${t.konu}`,
          time: dayjs(t.created_at).fromNow(),
          timestamp: t.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10),
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Dashboard verileri alınamadı" },
      { status: 500 }
    );
  }
}
