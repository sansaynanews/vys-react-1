import { auth } from "@/lib/auth";
import {
  Calendar,
  Users,
  Car,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || session?.user?.username || "Kullanıcı";
  const userRole = session?.user?.role || "user";

  // İstatistik kartları
  const stats = [
    {
      label: "Bugünkü Randevular",
      value: "8",
      icon: Calendar,
      color: "bg-blue-500",
      trend: "+12%"
    },
    {
      label: "Aktif Toplantılar",
      value: "3",
      icon: Users,
      color: "bg-cyan-500",
      trend: "+5%"
    },
    {
      label: "Araç Kullanımda",
      value: "5",
      icon: Car,
      color: "bg-emerald-500",
      trend: "0%"
    },
    {
      label: "Bekleyen Evraklar",
      value: "12",
      icon: FileText,
      color: "bg-purple-500",
      trend: "-3%"
    }
  ];

  // Yaklaşan etkinlikler
  const upcomingEvents = [
    {
      title: "Vali Makam Toplantısı",
      time: "14:00",
      type: "Toplantı",
      status: "Bekliyor"
    },
    {
      title: "Protokol Ziyareti",
      time: "16:30",
      type: "Ziyaret",
      status: "Onaylandı"
    },
    {
      title: "İl Koordinasyon Kurulu",
      time: "10:00 (Yarın)",
      type: "Toplantı",
      status: "Planlandı"
    }
  ];

  // Son aktiviteler
  const recentActivities = [
    {
      action: "Yeni randevu eklendi",
      user: "Protokol Birimi",
      time: "5 dakika önce",
      icon: Calendar
    },
    {
      action: "Evrak güncellendi",
      user: "Evrak Servisi",
      time: "15 dakika önce",
      icon: FileText
    },
    {
      action: "Araç ataması yapıldı",
      user: "Araç Planlama",
      time: "1 saat önce",
      icon: Car
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hoş Geldiniz Başlığı */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          Hoş Geldiniz, {userName}
        </h1>
        <p className="text-blue-100">
          Valilik Yönetim Sistemi Dashboard - Bugünün özeti
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${
                  stat.trend.startsWith('+') ? 'text-emerald-500' :
                  stat.trend.startsWith('-') ? 'text-red-500' :
                  'text-slate-400'
                }`}>
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yaklaşan Etkinlikler */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">Yaklaşan Etkinlikler</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-slate-500">{event.time}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                      {event.type}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                  event.status === 'Onaylandı' ? 'bg-emerald-100 text-emerald-600' :
                  event.status === 'Bekliyor' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-800">Son Aktiviteler</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 text-sm">
                      {activity.action}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{activity.user}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Yeni Randevu</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition">
            <Users className="w-8 h-8 text-cyan-600" />
            <span className="text-sm font-medium text-slate-700">Toplantı Planla</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
            <Car className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">Araç Talep</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition">
            <FileText className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-slate-700">Evrak Kaydı</span>
          </button>
        </div>
      </div>
    </div>
  );
}
