import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Calendar,
  Users,
  Car,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";
import Link from "next/link";

// Yardımcı fonksiyon: Tarih formatlama
function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || session?.user?.username || "Kullanıcı";

  // Tarih Hesaplamaları (Bugün)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Veritabanı Sorguları
  // 1. İstatistikler
  const [
    todayRandevuCount,
    activeMeetingsCount,
    todayCarMoves,
    todayEvrakCount,
    upcomingRandevular,
    upcomingMeetings
  ] = await Promise.all([
    // Bugünün Randevuları
    prisma.randevular.count({
      where: {
        tarih: {
          gte: today,
          lt: tomorrow
        }
      }
    }),
    // Bugünün Toplantıları
    prisma.salon_rezervasyonlari.count({
      where: {
        tarih: {
          gte: today,
          lt: tomorrow
        }
      }
    }),
    // Bugünkü Araç Hareketleri
    prisma.arac_gecmis.count({
      where: {
        tarih: {
          gte: today,
          lt: tomorrow
        }
      }
    }),
    // Bugün Gelen Evraklar
    prisma.evraklar.count({
      where: {
        gelis_tarih: {
          gte: today,
          lt: tomorrow
        }
      }
    }),
    // Yaklaşan 5 Randevu
    prisma.randevular.findMany({
      where: {
        tarih: {
          gte: today
        },
        durum: { not: "İptal" }
      },
      orderBy: [{ tarih: 'asc' }, { saat: 'asc' }],
      take: 5
    }),
    // Yaklaşan 5 Toplantı
    prisma.salon_rezervasyonlari.findMany({
      where: {
        tarih: {
          gte: today
        }
      },
      orderBy: [{ tarih: 'asc' }, { bas_saat: 'asc' }],
      take: 5
    })
  ]);

  // Ajanda Birleştirme (Randevu + Toplantı)
  const agenda = [
    ...upcomingRandevular.map(r => ({
      id: `r-${r.id}`,
      title: r.ad_soyad || r.kurum || "İsimsiz Randevu",
      type: "Randevu",
      date: r.tarih,
      time: r.saat || "-",
      location: "Makam",
      status: r.durum || "Bekliyor"
    })),
    ...upcomingMeetings.map(t => ({
      id: `m-${t.id}`,
      title: t.baslik || t.salon_ad || "Toplantı",
      type: "Toplantı",
      date: t.tarih,
      time: t.bas_saat || "-",
      location: t.salon_ad || "Salon Belirtilmedi",
      status: "Planlandı"
    }))
  ].sort((a, b) => {
    // Tarih ve saate göre sırala
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return a.time.localeCompare(b.time);
  }).slice(0, 6); // İlk 6 kayıt

  // İstatistik Kartları Verisi
  const stats = [
    {
      label: "Bugünkü Randevular",
      value: todayRandevuCount,
      icon: Calendar,
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      href: "/dashboard/randevu"
    },
    {
      label: "Bugünkü Toplantılar",
      value: activeMeetingsCount,
      icon: Users,
      color: "bg-violet-500",
      bg: "bg-violet-50",
      text: "text-violet-600",
      href: "/dashboard/toplanti"
    },
    {
      label: "Araç Hareketleri",
      value: todayCarMoves,
      icon: Car,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      href: "/dashboard/arac"
    },
    {
      label: "Gelen Evraklar",
      value: todayEvrakCount,
      icon: FileText,
      color: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
      href: "/dashboard/evrak"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
                Hoş Geldiniz, {userName}
              </h1>
              <p className="text-blue-100 text-lg opacity-90 font-light">
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard/randevu" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl backdrop-blur-sm transition-all text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Hızlı Randevu
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              href={stat.href}
              key={index}
              className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.text}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {stat.value > 0 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <TrendingUp className="w-3 h-3" />
                      Aktif
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-1 font-mono tracking-tight">{stat.value}</h3>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agenda / Upcoming Events */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Yaklaşan Etkinlikler</h2>
            </div>
            <Link href="/dashboard/randevu" className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1 group">
              Tümünü Gör <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex-1 p-2">
            {agenda.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Calendar className="w-12 h-12 mb-3 text-slate-200" />
                <p>Yaklaşan etkinlik bulunmuyor.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {agenda.map((item, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors rounded-xl flex items-center gap-4 group">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                      <span className="text-xs font-semibold text-slate-500 uppercase group-hover:text-blue-500">
                        {item.date ? new Date(item.date).toLocaleDateString('tr-TR', { month: 'short' }) : '-'}
                      </span>
                      <span className="text-xl font-bold text-slate-800 group-hover:text-blue-700">
                        {item.date ? new Date(item.date).getDate() : '-'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate text-base">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                        <span className={`px-2 py-0.5 rounded-md ${item.type === 'Randevu' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                          {item.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.time}
                        </span>
                        <span className="truncate max-w-[150px] hidden sm:block">
                          {item.location}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${item.status === 'Bekliyor' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        item.status === 'Planlandı' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="text-lg font-bold mb-4 relative z-10">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <Link href="/dashboard/randevu?new=true" className="bg-white/10 hover:bg-white/20 border border-white/20 p-3 rounded-xl backdrop-blur-md transition text-center flex flex-col items-center justify-center gap-2 h-24">
                <Calendar className="w-6 h-6" />
                <span className="text-xs font-semibold">Randevu Ekle</span>
              </Link>
              <Link href="/dashboard/toplanti" className="bg-white/10 hover:bg-white/20 border border-white/20 p-3 rounded-xl backdrop-blur-md transition text-center flex flex-col items-center justify-center gap-2 h-24">
                <Users className="w-6 h-6" />
                <span className="text-xs font-semibold">Toplantı</span>
              </Link>
              <Link href="/dashboard/arac" className="bg-white/10 hover:bg-white/20 border border-white/20 p-3 rounded-xl backdrop-blur-md transition text-center flex flex-col items-center justify-center gap-2 h-24">
                <Car className="w-6 h-6" />
                <span className="text-xs font-semibold">Araç İste</span>
              </Link>
              <Link href="/dashboard/talimatlar" className="bg-white/10 hover:bg-white/20 border border-white/20 p-3 rounded-xl backdrop-blur-md transition text-center flex flex-col items-center justify-center gap-2 h-24">
                <FileText className="w-6 h-6" />
                <span className="text-xs font-semibold">Talimat Ver</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Sistem Durumu
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Sunucu Durumu</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Aktif
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Veritabanı</span>
                <span className="text-emerald-600 font-bold">Bağlı</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Son Güncelleme</span>
                <span className="text-slate-700 font-mono text-xs">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
