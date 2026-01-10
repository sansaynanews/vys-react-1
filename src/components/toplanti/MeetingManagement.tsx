"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Settings, Plus, Trash2, MapPin, Users, Monitor, Edit2, Sparkles,
    Calendar as CalendarIcon, Check, X, Info, LayoutGrid, List
} from 'lucide-react';
import { Calendar as SmallCalendar } from "@/components/ui/Calendar";
import { tr } from "date-fns/locale";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// 1. AYARLAR
moment.locale('tr');
const localizer = momentLocalizer(moment);

// SABİTLER
const STANDARD_EQUIPMENT = [
    { label: "Projeksiyon", icon: "📽️" },
    { label: "Ses Sistemi", icon: "🔊" },
    { label: "Akıllı Tahta", icon: "🖥️" },
    { label: "Video Konferans", icon: "📹" },
    { label: "Klima", icon: "❄️" },
    { label: "İnternet / WiFi", icon: "📶" },
    { label: "Makam Ekranı", icon: "📺" },
    { label: "Kürsü", icon: "🎤" },
];

// TYPE DEFINITIONS
interface Room {
    id: number;
    title: string;
    capacity: number;
    color: string;
    konum?: string;
    ekipman?: string;
    notlar?: string;
}

interface Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    resourceId: number;
    isProtocol: boolean;
    organizer: string;
    desc?: string;
}

export default function MeetingManagement() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'calendar' | 'booking' | 'admin'>('calendar');
    const [events, setEvents] = useState<Event[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Date State for Small Calendar
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Booking Form State
    const [formData, setFormData] = useState({
        title: '',
        resourceId: 0,
        start: '',
        end: '',
        organizer: '',
        isProtocol: false
    });

    // Room Form State
    const [roomForm, setRoomForm] = useState({
        ad: '',
        kapasite: '',
        konum: '',
        notlar: ''
    });

    // Ekipman Seçimi State'leri
    const [selectedStandard, setSelectedStandard] = useState<string[]>([]);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

    const [mounted, setMounted] = useState(false);
    const { showToast } = useToastStore();
    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Salonları Çek
            const roomRes = await fetch('/api/toplanti/salonlar');
            const roomJson = await roomRes.json();

            let mappedRooms: Room[] = [];
            if (roomJson.success) {
                const colors = ['#1e40af', '#b91c1c', '#15803d', '#d97706', '#7c3aed', '#0891b2', '#be185d'];
                mappedRooms = roomJson.data.map((r: any, index: number) => ({
                    id: r.id,
                    title: r.ad,
                    capacity: r.kapasite,
                    color: colors[index % colors.length],
                    konum: r.konum,
                    ekipman: r.ekipman,
                    notlar: r.notlar
                }));
                setRooms(mappedRooms);

                if (mappedRooms.length > 0 && formData.resourceId === 0) {
                    setFormData(prev => ({ ...prev, resourceId: mappedRooms[0].id }));
                }
            }

            // Etkinlikleri Çek
            const eventRes = await fetch('/api/toplanti');
            const eventJson = await eventRes.json();
            if (eventJson.success) {
                const mappedEvents = eventJson.data.map((e: any) => ({
                    ...e,
                    start: new Date(e.start),
                    end: new Date(e.end)
                }));
                setEvents(mappedEvents);
            }
        } catch (error) {
            console.error("Veri yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---
    const handleSaveBooking = async () => {
        if (!formData.title || !formData.start || !formData.end) {
            showToast("Lütfen zorunlu alanları doldurunuz.", "warning");
            return;
        }

        const newStart = new Date(formData.start);
        const newEnd = new Date(formData.end);
        const selectedRoomId = Number(formData.resourceId);

        // Çakışma Kontrolü
        const conflict = events.find(event =>
            event.resourceId === selectedRoomId &&
            ((newStart >= event.start && newStart < event.end) ||
                (newEnd > event.start && newEnd <= event.end) ||
                (newStart <= event.start && newEnd >= event.end))
        );

        if (conflict) {
            if (formData.isProtocol) {
                const confirmOverride = window.confirm(
                    `⚠️ DİKKAT: "${conflict.title}" toplantısı ile çakışıyor.\nPROTOKOL yetkisiyle iptal edilip yerine kaydedilsin mi?`
                );

                if (confirmOverride) {
                    try {
                        await fetch(`/api/toplanti/${conflict.id}`, { method: 'DELETE' });
                        await createNewEvent(newStart, newEnd);
                        showToast("Eski toplantı iptal edildi ve yeni kayıt oluşturuldu.", "success");
                    } catch (error) { showToast("İşlem başarısız.", "error"); }
                }
            } else {
                showToast(`Seçilen saatte salon dolu! Engelleyen: ${conflict.title}`, "error");
            }
        } else {
            await createNewEvent(newStart, newEnd);
            showToast("Rezervasyon başarıyla oluşturuldu.", "success");
        }
    };

    const createNewEvent = async (start: Date, end: Date) => {
        const res = await fetch('/api/toplanti', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: formData.title,
                resourceId: Number(formData.resourceId),
                start: start.toISOString(),
                end: end.toISOString(),
                organizer: formData.organizer,
                isProtocol: formData.isProtocol
            })
        });
        if (res.ok) {
            await fetchData();
            setFormData({ ...formData, title: '', start: '', end: '', organizer: '', isProtocol: false });
            setActiveTab('calendar');
        }
    };

    // Ekipman UI Mantığı
    const toggleStandard = (label: string) => {
        setSelectedStandard(prev =>
            prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label]
        );
    };

    const handleCreateTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!customTags.includes(tagInput.trim())) {
                setCustomTags([...customTags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setCustomTags(prev => prev.filter(t => t !== tag));
    };

    const handleAddRoom = async () => {
        if (!roomForm.ad || !roomForm.kapasite) { showToast("Salon adı ve kapasite zorunludur.", "warning"); return; }

        const allEquip = [...selectedStandard, ...customTags].join(', ');

        try {
            const res = await fetch('/api/toplanti/salonlar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...roomForm,
                    ekipman: allEquip
                })
            });
            if (res.ok) {
                await fetchData();
                setRoomForm({ ad: '', kapasite: '', konum: '', notlar: '' });
                setSelectedStandard([]);
                setCustomTags([]);
                setTagInput('');
                showToast("Salon başarıyla eklendi.", "success");
            }
        } catch (err) { showToast("Hata oluştu.", "error"); }
    };

    const handleDeleteRoom = (id: number) => {
        setDeleteTargetId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteRoom = async () => {
        if (!deleteTargetId) return;
        setDeleteLoading(true);
        try {
            await fetch(`/api/toplanti/salonlar/${deleteTargetId}`, { method: 'DELETE' });
            fetchData();
            showToast("Salon silindi.", "success");
        } catch (err) {
            showToast("Silinemedi.", "error");
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
            setDeleteTargetId(null);
        }
    };

    // Edit Room Functions
    const handleEditRoom = (room: Room) => {
        setEditMode(true);
        setEditingRoomId(room.id);
        setRoomForm({
            ad: room.title,
            kapasite: String(room.capacity),
            konum: room.konum || '',
            notlar: room.notlar || ''
        });
        // Parse equipment
        if (room.ekipman) {
            const allEquip = room.ekipman.split(',').map(e => e.trim());
            const standardLabels = STANDARD_EQUIPMENT.map(e => e.label);
            setSelectedStandard(allEquip.filter(e => standardLabels.includes(e)));
            setCustomTags(allEquip.filter(e => !standardLabels.includes(e)));
        } else {
            setSelectedStandard([]);
            setCustomTags([]);
        }
    };

    const handleUpdateRoom = async () => {
        if (!editingRoomId || !roomForm.ad || !roomForm.kapasite) {
            showToast("Salon adı ve kapasite zorunludur.", "warning");
            return;
        }
        const allEquip = [...selectedStandard, ...customTags].join(', ');
        try {
            const res = await fetch(`/api/toplanti/salonlar/${editingRoomId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...roomForm, ekipman: allEquip })
            });
            if (res.ok) {
                await fetchData();
                cancelEdit();
                showToast("Salon güncellendi.", "success");
            } else {
                showToast("Güncelleme başarısız.", "error");
            }
        } catch (err) {
            showToast("Hata oluştu.", "error");
        }
    };

    const cancelEdit = () => {
        setEditMode(false);
        setEditingRoomId(null);
        setRoomForm({ ad: '', kapasite: '', konum: '', notlar: '' });
        setSelectedStandard([]);
        setCustomTags([]);
        setTagInput('');
    };

    // --- STYLING ---
    const eventStyleGetter = (event: Event) => {
        const backgroundColor = event.isProtocol ? '#dc2626' : (rooms.find(r => r.id === event.resourceId)?.color || '#3174ad');
        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.95,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '0.8rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
        };
    };

    if (!mounted) return <div className="p-10 text-center text-slate-500">Yükleniyor...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-22rem)] min-h-[600px]">

            {/* HEADER ROW - Premium Dark Gradient */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-4 lg:p-5 shadow-2xl border border-white/5 mb-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Sol: Başlık */}
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium text-blue-300">Salon Yönetim Sistemi</span>
                        </div>
                        <h1 className="text-xl lg:text-2xl font-bold text-white">Toplantı Yönetimi</h1>
                    </div>

                    {/* Sağ: Tab Butonları */}
                    <div className="flex flex-wrap gap-1 bg-white/10 backdrop-blur-sm p-1 rounded-lg border border-white/10 w-full lg:w-auto">
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <CalendarIcon className="w-4 h-4" /> <span>Takvim</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('booking')}
                            className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'booking' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <Plus className="w-4 h-4" /> <span>Rezervasyon</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'admin' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                        >
                            <Settings className="w-4 h-4" /> <span>Salonlar</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6">

                {/* SIDEBAR (Only visible on Calendar Tab) */}
                {activeTab === 'calendar' && (
                    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
                        {/* Mini Calendar */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex justify-center">
                            <SmallCalendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md"
                                locale={tr}
                            />
                        </div>

                        {/* Salonlar (Legend) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Salonlar</h3>
                            <div className="space-y-2">
                                {rooms.map(r => (
                                    <div key={r.id} className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded hover:bg-slate-50 transition-colors cursor-default">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }}></span>
                                        <span className="truncate font-medium">{r.title}</span>
                                        <span className="ml-auto text-xs text-slate-400">({r.capacity})</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-indigo-50 p-3 rounded-lg text-center border border-indigo-100">
                                    <p className="text-xl font-bold text-indigo-700">{rooms.length}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase">Salon</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                                    <p className="text-xl font-bold text-blue-700">{events.length}</p>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase">Toplantı</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col">

                    {/* TAB CONTENT: CALENDAR */}
                    {activeTab === 'calendar' && (
                        <div className="flex-1 h-full min-h-[500px]">
                            <BigCalendar
                                localizer={localizer}
                                events={events}
                                date={selectedDate}
                                onNavigate={(date: Date) => setSelectedDate(date)}
                                startAccessor="start"
                                endAccessor="end"
                                resourceIdAccessor="id"
                                resourceTitleAccessor="title"
                                resources={rooms.length > 0 ? rooms : undefined}
                                defaultView={Views.DAY}
                                views={[Views.DAY, Views.WEEK, Views.AGENDA]}
                                step={30}
                                min={new Date(0, 0, 0, 0, 0, 0)}
                                max={new Date(0, 0, 0, 23, 59, 59)}
                                eventPropGetter={eventStyleGetter}
                                culture='tr'
                                formats={{
                                    dayHeaderFormat: (date: Date) => moment(date).format('dddd D MMMM YYYY'),
                                    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                                        `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM YYYY')}`,
                                    agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                                        `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM YYYY')}`
                                }}
                                className="rounded-lg text-sm h-full"
                                tooltipAccessor={(event: Event) => `${event.title} - ${event.organizer} (${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')})`}
                                messages={{
                                    next: "İleri",
                                    previous: "Geri",
                                    today: "Bugün",
                                    month: "Ay",
                                    week: "Hafta",
                                    day: "Gün",
                                    agenda: "Ajanda",
                                    date: "Tarih",
                                    time: "Saat",
                                    event: "Toplantı",
                                    noEventsInRange: "Bu aralıkta toplantı yok.",
                                    allDay: "Tüm Gün",
                                    showMore: (total: number) => `+${total} daha`
                                }}
                            />
                        </div>
                    )}

                    {/* TAB CONTENT: BOOKING */}
                    {activeTab === 'booking' && (
                        <div className="max-w-2xl mx-auto w-full">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 pb-4 border-b border-slate-100">
                                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Plus className="w-5 h-5" /></span>
                                Yeni Toplantı Talebi
                            </h2>
                            <div className="space-y-5">
                                {/* Form fields... (Kodun devamı öncekiyle aynı state'i kullandığı için buraya tekrar yazıyorum) */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Toplantı Konusu</label>
                                    <input type="text" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Düzenleyen Birim</label>
                                    <input type="text" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm" value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Salon</label>
                                    <select className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm" value={formData.resourceId} onChange={e => setFormData({ ...formData, resourceId: Number(e.target.value) })}>
                                        {rooms.map(room => <option key={room.id} value={room.id}>{room.title}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Başlangıç</label><input type="datetime-local" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg text-sm" value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} /></div>
                                    <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Bitiş</label><input type="datetime-local" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-lg text-sm" value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} /></div>
                                </div>
                                <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5" checked={formData.isProtocol} onChange={e => setFormData({ ...formData, isProtocol: e.target.checked })} />
                                        <span className="text-red-700 font-bold text-sm">PROTOKOL (VALİLİK MAKAMI)</span>
                                    </label>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setActiveTab('calendar')} className="flex-1 py-2 border rounded-lg">Vazgeç</button>
                                    <button onClick={handleSaveBooking} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Oluştur</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: ADMIN - PREMIUM DESIGN */}
                    {activeTab === 'admin' && (
                        <div className="h-full overflow-auto">
                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full">

                                {/* SOL PANEL: YENİ SALON FORMU */}
                                <div className="xl:col-span-2 space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-[1px] shadow-xl shadow-indigo-500/20">
                                        <div className="bg-white rounded-2xl p-6 h-full">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${editMode ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'}`}>
                                                    {editMode ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{editMode ? 'Salon Düzenle' : 'Yeni Salon Ekle'}</h3>
                                                    <p className="text-xs text-slate-400">{editMode ? 'Salon bilgilerini güncelle' : 'Toplantı salonu tanımla'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="group">
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Salon Adı</label>
                                                    <input
                                                        type="text"
                                                        className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                                                        placeholder="Örn: 15 Temmuz Şehitler Salonu"
                                                        value={roomForm.ad}
                                                        onChange={e => setRoomForm({ ...roomForm, ad: e.target.value })}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kapasite</label>
                                                        <div className="relative">
                                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                            <input
                                                                type="number"
                                                                className="w-full border-2 border-slate-100 rounded-xl p-3 pl-10 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                                                                placeholder="50"
                                                                value={roomForm.kapasite}
                                                                onChange={e => setRoomForm({ ...roomForm, kapasite: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Konum</label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                            <input
                                                                type="text"
                                                                className="w-full border-2 border-slate-100 rounded-xl p-3 pl-10 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                                                                placeholder="Z. Kat"
                                                                value={roomForm.konum}
                                                                onChange={e => setRoomForm({ ...roomForm, konum: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* EKİPMAN SEÇİMİ - MODERN CHIPS */}
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Donanım & Ekipman</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {STANDARD_EQUIPMENT.map(eq => (
                                                            <button
                                                                key={eq.label}
                                                                onClick={() => toggleStandard(eq.label)}
                                                                className={`group/chip flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${selectedStandard.includes(eq.label)
                                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50'
                                                                    }`}
                                                            >
                                                                <span className="text-base">{eq.icon}</span>
                                                                {eq.label}
                                                                {selectedStandard.includes(eq.label) && <Check className="w-3.5 h-3.5 ml-1" />}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* DİĞER EKİPMAN - TAG INPUT */}
                                                    <div className="mt-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {customTags.map(tag => (
                                                                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
                                                                    {tag}
                                                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                                </span>
                                                            ))}
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    placeholder="+ Diğer ekle..."
                                                                    className="border-2 border-dashed border-slate-200 rounded-lg px-3 py-1.5 text-xs w-32 focus:border-indigo-400 focus:bg-indigo-50/30 outline-none transition-all"
                                                                    value={tagInput}
                                                                    onChange={e => setTagInput(e.target.value)}
                                                                    onKeyDown={handleCreateTag}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* NOTLAR */}
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notlar</label>
                                                    <textarea
                                                        className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none h-20 placeholder:text-slate-300"
                                                        placeholder="Opsiyonel notlar..."
                                                        value={roomForm.notlar}
                                                        onChange={e => setRoomForm({ ...roomForm, notlar: e.target.value })}
                                                    />
                                                </div>

                                                {/* KAYDET / GÜNCELLE BUTONLARI */}
                                                <div className="flex gap-3">
                                                    {editMode && (
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="flex-1 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                                        >
                                                            Vazgeç
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={editMode ? handleUpdateRoom : handleAddRoom}
                                                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 text-white ${editMode
                                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/30 hover:shadow-blue-500/40'
                                                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-indigo-500/30 hover:shadow-indigo-500/40'
                                                            }`}
                                                    >
                                                        {editMode ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                        {editMode ? 'Güncelle' : 'Salonu Kaydet'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SAĞ PANEL: MEVCUT SALONLAR */}
                                <div className="xl:col-span-3 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                <LayoutGrid className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">Mevcut Salonlar</h3>
                                                <p className="text-xs text-slate-400">{rooms.length} salon tanımlı</p>
                                            </div>
                                        </div>
                                    </div>

                                    {rooms.length === 0 ? (
                                        <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                <Settings className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-medium">Henüz salon eklenmemiş</p>
                                            <p className="text-xs text-slate-300 mt-1">Sol panelden yeni salon tanımlayın</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-auto pr-2">
                                            {rooms.map((room, idx) => (
                                                <div
                                                    key={room.id}
                                                    className="group relative bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-transparent hover:ring-2 hover:ring-indigo-500/20 transition-all duration-300 overflow-hidden"
                                                >
                                                    {/* Üst gradient şerit */}
                                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${room.color}, ${room.color}dd)` }}></div>

                                                    {/* Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110"
                                                                style={{ backgroundColor: room.color, boxShadow: `0 8px 16px ${room.color}40` }}
                                                            >
                                                                {room.title.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{room.title}</h4>
                                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.capacity} Kişi</span>
                                                                    {room.konum && <span className="flex items-center gap-1">• <MapPin className="w-3 h-3" /> {room.konum}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleEditRoom(room)}
                                                                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-all"
                                                                title="Düzenle"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-blue-500" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRoom(room.id)}
                                                                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all"
                                                                title="Sil"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Ekipmanlar - Tümünü Göster */}
                                                    {room.ekipman ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {room.ekipman.split(',').map((e, i) => (
                                                                <span key={i} className="text-[11px] px-2 py-1 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 rounded-md border border-slate-100 font-medium">
                                                                    {e.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-300 italic">Ekipman bilgisi yok</p>
                                                    )}

                                                    {/* Notlar */}
                                                    {room.notlar && (
                                                        <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 italic line-clamp-2">
                                                            <Info className="w-3 h-3 inline mr-1" />{room.notlar}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* Silme Onay Dialogu */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setDeleteTargetId(null);
                }}
                onConfirm={confirmDeleteRoom}
                title="Salon Sil"
                message="Bu salonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="Vazgeç"
                variant="danger"
                loading={deleteLoading}
            />
        </div>
    );
}

