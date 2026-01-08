"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import 'dayjs/locale/tr';

dayjs.locale('tr');

export default function MakamEkranPage() {
    const [data, setData] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    // Auto update clock locally
    useEffect(() => {
        const timer = setInterval(() => {
            const now = dayjs();
            setCurrentTime(now.format("HH:mm"));
            setCurrentDate(now.format("DD MMMM YYYY, dddd"));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Data
    const fetchData = async () => {
        try {
            const res = await fetch("/api/makam-ekran");
            const json = await res.json();
            if (res.ok) {
                setData(json);
            }
        } catch (error) {
            console.error("Fetch error", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div className="h-screen flex items-center justify-center text-slate-500 animate-pulse">Sistem Yükleniyor...</div>;

    const { current, upcoming, completed } = data;

    return (
        <div className="h-screen flex flex-col p-8 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
            {/* Header */}
            <header className="flex justify-between items-start border-b border-slate-800/50 pb-6 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-blue-950/30 rounded-full flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                        {/* Simple Logo Placeholder */}
                        <div className="text-4xl">🏛️</div>
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight text-white mb-2">VALİLİK MAKAMI</h1>
                        <p className="text-2xl text-slate-400 uppercase tracking-[0.2em] font-light">Özel Kalem Müdürlüğü</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-7xl font-mono font-bold text-blue-100 tabular-nums tracking-tight drop-shadow-lg">{currentTime}</div>
                    <div className="text-2xl text-slate-400 mt-2 font-light">{currentDate}</div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 grid grid-cols-12 gap-8 min-h-0">

                {/* Left Panel: Completed */}
                <div className="col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
                    <h3 className="text-lg uppercase tracking-widest text-blue-400 font-bold border-b border-white/10 pb-4 mb-4">
                        Tamamlanan
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {completed.length === 0 ? (
                            <p className="text-slate-500 italic">Henüz kayıt yok.</p>
                        ) : (
                            completed.map((item: any, i: number) => (
                                <div key={i} className="opacity-60 border-l-2 border-slate-600 pl-4 py-1">
                                    <div className="text-xl font-mono text-slate-300">{item.saat}</div>
                                    <div className="font-semibold text-slate-200 text-lg">{item.ad_soyad}</div>
                                    <div className="text-sm text-slate-400">{item.kurum}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Center Panel: Current Active */}
                <div className="col-span-6 flex flex-col items-center justify-center text-center relative">

                    {!current ? (
                        <div className="text-center">
                            <h2 className="text-6xl text-slate-700 font-serif opacity-50 mb-4">Program Tamamlandı</h2>
                            <p className="text-2xl text-slate-600">Bekleyen randevu bulunmamaktadır.</p>
                        </div>
                    ) : (
                        <div className="w-full animate-in fade-in zoom-in duration-700">
                            <div className="inline-block px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold uppercase tracking-[0.3em] mb-12">
                                Sıradaki Kabul
                            </div>

                            <div className="text-[8rem] leading-none font-bold text-white mb-8 font-mono tracking-tighter drop-shadow-2xl">
                                {current.saat}
                            </div>

                            <h1 className="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6 drop-shadow-sm leading-tight">
                                {current.ad_soyad}
                            </h1>

                            <div className="text-4xl text-blue-200/80 font-light uppercase tracking-wide">
                                {current.kurum}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Panel: Upcoming */}
                <div className="col-span-3 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
                    <h3 className="text-lg uppercase tracking-widest text-amber-400 font-bold border-b border-white/10 pb-4 mb-4">
                        Günün Kalanı
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                        {upcoming.length === 0 ? (
                            <p className="text-slate-500 italic">Kayıt yok.</p>
                        ) : (
                            upcoming.map((item: any, i: number) => (
                                <div key={i} className="border-l-4 border-amber-500/50 pl-4 py-1">
                                    <div className="text-2xl font-mono text-amber-100 font-bold">{item.saat}</div>
                                    <div className="font-bold text-white text-xl leading-tight my-1">{item.ad_soyad}</div>
                                    <div className="text-slate-400">{item.kurum}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="mt-8 border-t border-slate-800/50 pt-6">
                <div className="flex items-center gap-6">
                    <span className="px-4 py-1 rounded bg-blue-900/50 border border-blue-500/30 text-blue-200 font-bold uppercase text-sm">
                        Bilgi
                    </span>
                    <div className="text-xl text-slate-400 font-light overflow-hidden whitespace-nowrap">
                        <div className="animate-marquee inline-block">
                            Makam ziyaretlerinizde randevu saatlerine riayet etmeniz önemle rica olunur. Lütfen telefonlarınızı sessize alınız.
                        </div>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                    padding-left: 100%; 
                }
            `}</style>
        </div>
    );
}
