"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Settings, Plus, Trash2, MapPin, Users, Monitor, Edit2, Sparkles, ChevronLeft, ChevronRight,
    Calendar as CalendarIcon, Check, X, Info, LayoutGrid, List, Repeat, FileText, Paperclip, Download, Loader2,
    Search, Printer, FileSpreadsheet, CalendarDays, CalendarRange, Eye, Clock, User
} from 'lucide-react';
import { Calendar as SmallCalendar } from "@/components/ui/Calendar";
import { tr } from "date-fns/locale";
import { format } from "date-fns";
import { useToastStore } from "@/hooks/useToastStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { TimePicker } from "@/components/ui/TimePicker";
import { cn } from "@/lib/utils";

// 1. AYARLAR
moment.locale('tr');
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

// SABİTLER
const MEETING_TYPES = [
    "Yönetim ve Karar Alma Toplantıları",
    "Koordinasyon ve Planlama Toplantıları",
    "Denetim, İzleme ve Değerlendirme Toplantıları",
    "Proje, İhale ve Teknik Toplantılar",
    "Personel ve İnsan Kaynakları Toplantıları",
    "Bilgilendirme ve İstişare Toplantıları",
    "Kriz ve Acil Durum Toplantıları",
    "Protokol, Temsil ve Resmî Toplantılar",
    "Diğer"
];
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
    // Extended fields
    format?: string;
    type?: string;
    participants?: string;
    contactPerson?: string;
    contactInfo?: string;
    equipment?: string;
    catering?: string;
    press?: boolean;
    agenda?: string;
    status?: string;
    statusReason?: string;
    postponedDate?: Date;
    approvedBy?: string;
    documents?: any[];
}

const STATUS_OPTIONS = ["Onay Bekliyor", "Onaylandı", "Ertelendi", "İptal Edildi", "Tamamlandı"];

// Custom Toolbar Component
const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = moment(toolbar.date);
        return (
            <span className="text-lg font-bold text-slate-800 capitalize">
                {date.format('D MMMM YYYY')}
                <span className="text-slate-400 font-normal ml-2 text-sm">{date.format('dddd')}</span>
            </span>
        );
    };

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 p-1">
            {/* Bugün / Geri / İleri */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button onClick={goToBack} className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-all shadow-sm hover:shadow">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={goToCurrent} className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white rounded-md transition-all shadow-sm hover:shadow">
                    Bugün
                </button>
                <button onClick={goToNext} className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-all shadow-sm hover:shadow">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Tarih Başlığı */}
            <div className="flex-1 text-center">
                {label()}
            </div>

            {/* View Switcher */}
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                <button
                    onClick={() => toolbar.onView('day')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${toolbar.view === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Gün
                </button>
                <button
                    onClick={() => toolbar.onView('week')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${toolbar.view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Hafta
                </button>
            </div>
        </div>
    );
};

// Custom Agenda Event Component - Shows full meeting details
const AgendaEvent = ({ event }: { event: Event }) => {
    return (
        <div className="py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{event.title}</span>
                        {event.isProtocol && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">
                                Protokol
                            </span>
                        )}
                    </div>
                    {event.organizer && (
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {event.organizer}
                        </p>
                    )}
                </div>
                <div className="text-right text-xs text-slate-400 flex-shrink-0">
                    {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                </div>
            </div>
        </div>
    );
};

export default function MeetingManagement() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'list' | 'admin'>('list');
    const [isCreatePanelOpen, setCreatePanelOpen] = useState(false);

    // Calendar View State
    const [events, setEvents] = useState<Event[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Date State for Small Calendar
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [view, setView] = useState(Views.DAY);

    // Booking Form State - New Structure
    const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");

    const [formData, setFormData] = useState({
        title: '',
        resourceId: 0,
        organizer: '',
        description: '',
        isProtocol: false,
        type: '',
        contactPerson: '',
        contactInfo: '',
        recurrence: 'none',
        repeatCount: 1,
        // New Fields
        format: 'Yüz Yüze',
        equipment: '',
        participants: '',
        catering: '',
        press: false,
        agenda: '',
        status: 'Onay Bekliyor',
        statusReason: '',
        postponedDate: null as Date | null,
        approvedBy: ''
    });

    const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
    const [deleteEventOpen, setDeleteEventOpen] = useState(false);

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

    // Amirler & Files State
    const [amirler, setAmirler] = useState<any[]>([]);
    const [isAmirSelection, setIsAmirSelection] = useState(false);
    const [agendaFile, setAgendaFile] = useState<File | null>(null);
    const [participantFile, setParticipantFile] = useState<File | null>(null);
    const [pressFile, setPressFile] = useState<File | null>(null);
    const [customTagInput, setCustomTagInput] = useState('');
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);

    const [viewEvent, setViewEvent] = useState<Event | null>(null);

    // Quick Status Update State
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusUpdateData, setStatusUpdateData] = useState({
        id: 0,
        status: '',
        statusReason: '',
        postponedDate: null as Date | null,
        approvedBy: ''
    });

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
                    end: new Date(e.end),
                    documents: e.dokumanlar || [],
                    status: e.durum,
                    statusReason: e.durum_aciklamasi,
                    postponedDate: e.ertelenen_tarih,
                    approvedBy: e.onaylayan
                }));
                setEvents(mappedEvents);
            }

            // Amirleri Çek
            const amirRes = await fetch('/api/kurum-amirleri');
            const amirJson = await amirRes.json();
            if (amirJson.data) setAmirler(amirJson.data);


        } catch (error) {
            console.error("Veri yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---
    const createNewEvent = () => {
        setSelectedEventId(null);
        setFormData({
            title: '',
            resourceId: 0,
            organizer: '',
            description: '',
            isProtocol: false,
            type: '',
            contactPerson: '',
            contactInfo: '',
            recurrence: 'none',
            repeatCount: 1,
            format: 'Yüz Yüze',
            equipment: '',
            participants: '',
            catering: '',
            press: false,
            agenda: '',
            status: 'Onay Bekliyor',
            statusReason: '',
            postponedDate: null,
            approvedBy: ''
        });
        setBookingDate(undefined);
        setStartTime('');
        setEndTime('');
        // Reset File & Amir selection
        setAgendaFile(null);
        setParticipantFile(null);
        setIsAmirSelection(false);
        setCustomTagInput('');
        setCreatePanelOpen(true);
    };

    const handleEditEvent = (event: any) => {
        setFormData({
            title: event.title,
            resourceId: event.resourceId,
            organizer: event.organizer || '',
            description: event.desc || '',
            isProtocol: event.isProtocol || false,
            type: event.type || '',
            contactPerson: event.contactPerson || '',
            contactInfo: event.contactInfo || '',
            recurrence: 'none',
            repeatCount: 1,
            format: event.format || 'Yüz Yüze',
            equipment: event.equipment || '',
            participants: event.participants || '',
            catering: event.catering || '',
            press: event.press || false,
            agenda: event.agenda || '',
            status: event.status || 'Onay Bekliyor',
            statusReason: event.statusReason || '',
            postponedDate: event.postponedDate ? new Date(event.postponedDate) : null,
            approvedBy: event.approvedBy || ''
        });
        setBookingDate(new Date(event.start));
        setStartTime(moment(event.start).format('HH:mm'));
        setEndTime(moment(event.end).format('HH:mm'));
        setSelectedEventId(event.id);
        setCustomTagInput('');
        setCreatePanelOpen(true);
    };

    const onEventResize = async ({ event, start, end }: any) => {
        try {
            const res = await fetch(`/api/toplanti/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start, end })
            });

            if (res.ok) {
                setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, start, end } : ev));
                showToast("Toplantı süresi güncellendi.", "success");
            } else {
                showToast("Güncelleme başarısız.", "error");
            }
        } catch (error) {
            showToast("Hata oluştu.", "error");
        }
    };

    const onEventDrop = async ({ event, start, end, resourceId }: any) => {
        try {
            const res = await fetch(`/api/toplanti/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start, end, resourceId })
            });

            if (res.ok) {
                setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, start, end, resourceId: resourceId || ev.resourceId } : ev));
                showToast("Toplantı taşındı.", "success");
            } else {
                showToast("Taşıma başarısız.", "error");
            }
        } catch (error) {
            showToast("Hata oluştu.", "error");
        }
    };




    // --- DOCUMENTS STATE ---
    const [docsModalOpen, setDocsModalOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [currentDocs, setCurrentDocs] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // --- DOCUMENT ACTIONS ---
    const openViewModal = (event: Event) => {
        setViewEvent(event);
        setViewModalOpen(true);
    };

    const openDocsModal = async (eventId: number) => {
        setSelectedEventId(eventId);
        setDocsModalOpen(true);
        setCurrentDocs([]); // Reset
        try {
            const res = await fetch(`/api/toplanti/${eventId}/dokuman`);
            if (res.ok) {
                const data = await res.json();
                setCurrentDocs(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !selectedEventId) return;
        const file = e.target.files[0];

        // 25MB Limit Check
        if (file.size > 25 * 1024 * 1024) {
            showToast("Dosya boyutu 25MB'dan büyük olamaz.", "error");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload File
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadData.success) throw new Error(uploadData.message);

            // 2. Save Record
            const saveRes = await fetch(`/api/toplanti/${selectedEventId}/dokuman`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dosya_adi: uploadData.filename,
                    dosya_yolu: uploadData.path,
                    dosya_tipi: uploadData.type,
                    dosya_boyut: uploadData.size
                })
            });

            if (saveRes.ok) {
                const newDoc = await saveRes.json();
                setCurrentDocs(prev => [newDoc, ...prev]);
                showToast("Belge yüklendi.", "success");
                fetchData();
            } else {
                const err = await saveRes.json();
                throw new Error(err.error || "Kaydetme başarısız.");
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || "Yükleme başarısız.", "error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteDoc = async (docId: number) => {
        if (!confirm("Belgeyi silmek istiyor musunuz?")) return;
        try {
            const res = await fetch(`/api/toplanti/dokuman/${docId}`, { method: 'DELETE' });
            if (res.ok) {
                setCurrentDocs(prev => prev.filter(d => d.id !== docId));
                showToast("Belge silindi.", "success");
                fetchData();
            } else {
                showToast("Silinemedi: " + res.statusText, "error");
            }
        } catch (e) { showToast("Hata oluştu", "error"); }
    };

    const handleDeleteEvent = (id: number) => {
        setDeleteEventId(id);
        setDeleteEventOpen(true);
    };

    const confirmDeleteEvent = async () => {
        if (!deleteEventId) return;
        try {
            const res = await fetch(`/api/toplanti/${deleteEventId}`, { method: 'DELETE' });
            if (res.ok) {
                setEvents(prev => prev.filter(e => e.id !== deleteEventId));
                showToast("Toplantı silindi.", "success");
            } else {
                const err = await res.json();
                showToast(err.error || "Silinemedi.", "error");
            }
        } catch { showToast("Hata oluştu.", "error"); }
        setDeleteEventOpen(false);
        setDeleteEventId(null);
    };

    const handleSaveBooking = async () => {
        if (!formData.title) { showToast("Lütfen toplantı konusunu giriniz.", "warning"); return; }
        if (!bookingDate) { showToast("Lütfen toplantı tarihini seçiniz.", "warning"); return; }
        if (!startTime) { showToast("Lütfen başlangıç saatini seçiniz.", "warning"); return; }
        if (!endTime) { showToast("Lütfen bitiş saatini seçiniz.", "warning"); return; }

        // Tarih ve saat birleştirme
        const dateStr = moment(bookingDate).format('YYYY-MM-DD');
        const newStart = new Date(`${dateStr}T${startTime}:00`);
        const newEnd = new Date(`${dateStr}T${endTime}:00`);

        if (newEnd <= newStart) {
            showToast("Bitiş saati başlangıçtan sonra olmalıdır.", "warning");
            return;
        }

        const selectedRoomId = Number(formData.resourceId);

        // Çakışma Kontrolü
        const conflict = events.find(event =>
            event.resourceId === selectedRoomId &&
            (!selectedEventId || event.id !== selectedEventId) &&
            ((newStart >= event.start && newStart < event.end) ||
                (newEnd > event.start && newEnd <= event.end) ||
                (newStart <= event.start && newEnd >= event.end))
        );

        if (conflict) {
            if (formData.isProtocol) {
                if (!window.confirm(`⚠️ DİKKAT: "${conflict.title}" toplantısı ile çakışıyor.\nPROTOKOL yetkisiyle iptal edilip yerine kaydedilsin mi?`)) return;
                await fetch(`/api/toplanti/${conflict.id}`, { method: 'DELETE' });
            } else {
                showToast(`Seçilen saatte salon dolu! Engelleyen: ${conflict.title}`, "error");
                return;
            }
        }

        const data = {
            title: formData.title,
            start: newStart,
            end: newEnd,
            resourceId: selectedRoomId,
            organizer: formData.organizer,
            description: formData.description,
            isProtocol: formData.isProtocol,
            type: formData.type,
            contactPerson: formData.contactPerson,
            contactInfo: formData.contactInfo,
            recurrence: formData.recurrence,
            repeatCount: formData.repeatCount,
            format: formData.format,
            equipment: formData.equipment,
            participants: formData.participants,
            catering: formData.catering,
            press: formData.press,
            agenda: formData.agenda,
            status: formData.status
        };

        try {
            const method = selectedEventId ? 'PUT' : 'POST';
            const url = selectedEventId ? `/api/toplanti/${selectedEventId}` : '/api/toplanti';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const result = await res.json();
                const eventId = selectedEventId || result.data?.id || (result.created && result.created > 0 ? "new" : null);

                // Handle File Uploads
                if (eventId && eventId !== "new") {
                    const uploadFile = async (file: File, type: string) => {
                        const fd = new FormData();
                        fd.append('file', file);
                        try {
                            const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
                            const upData = await upRes.json();
                            if (upData.success) {
                                await fetch(`/api/toplanti/${eventId}/dokuman`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        dosya_adi: `${type}: ${file.name}`,
                                        dosya_yolu: upData.path,
                                        dosya_tipi: type,
                                        dosya_boyut: upData.size
                                    })
                                });
                            }
                        } catch (e) {
                            console.error("Dosya yükleme hatası:", e);
                            showToast(`${type} dosyası yüklenemedi.`, "error");
                        }
                    };

                    if (agendaFile) await uploadFile(agendaFile, 'Gündem Dosyası');
                    if (participantFile) await uploadFile(participantFile, 'Katılımcı Listesi');
                    if (pressFile) await uploadFile(pressFile, 'Basın Bülteni');
                }

                showToast(selectedEventId ? "Toplantı güncellendi." : "Toplantı oluşturuldu.", "success");
                setCreatePanelOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                showToast(err.error || "İşlem başarısız.", "error");
            }
        } catch (e: any) {
            console.error(e);
            showToast("Hata oluştu: " + (e.message || String(e)), "error");
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

    // --- FILTERING & EXPORT ---
    const filteredEvents = events.filter(event => {
        const eventDate = moment(event.start);
        const matchesSearch = (
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.organizer && event.organizer.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        let matchesTime = true;
        if (timeFilter === 'today') matchesTime = eventDate.isSame(moment(), 'day');
        else if (timeFilter === 'week') matchesTime = eventDate.isSame(moment(), 'week');

        return matchesSearch && matchesTime;
    });

    const openStatusModal = (event: Event) => {
        setStatusUpdateData({
            id: event.id,
            status: event.status || 'Onay Bekliyor',
            statusReason: event.statusReason || '',
            postponedDate: event.postponedDate ? new Date(event.postponedDate) : null,
            approvedBy: event.approvedBy || ''
        });
        setStatusModalOpen(true);
    };

    const handleQuickStatusSave = async () => {
        try {
            const res = await fetch(`/api/toplanti/${statusUpdateData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: statusUpdateData.status,
                    statusReason: statusUpdateData.statusReason,
                    postponedDate: statusUpdateData.postponedDate,
                    approvedBy: statusUpdateData.approvedBy
                })
            });
            if (res.ok) {
                showToast('Durum güncellendi.', 'success');
                setStatusModalOpen(false);
                fetchData();
            } else {
                showToast('Güncelleme başarısız.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Hata oluştu.', 'error');
        }
    };

    const handleExportExcel = () => {
        const headers = ["Konu", "Tarih", "Saat", "Salon", "Düzenleyen", "Durum"];
        const csvContent = [
            headers.join(","),
            ...filteredEvents.map(e => [
                `"${e.title.replace(/"/g, '""')}"`,
                moment(e.start).format("DD.MM.YYYY"),
                moment(e.start).format("HH:mm"),
                `"${(rooms.find(r => r.id === e.resourceId)?.title || '').replace(/"/g, '""')}"`,
                `"${(e.organizer || '').replace(/"/g, '""')}"`,
                `"${(e.desc || '').replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `toplanti_listesi_${moment().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const handlePrintDetail = () => {
        if (!viewEvent) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
            <head>
                <title>Toplantı Detayı - ${viewEvent.title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start; }
                    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
                    .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
                    .status { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #f1f5f9; color: #475569; }
                    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 30px; }
                    .item { margin-bottom: 4px; }
                    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
                    .value { font-size: 14px; font-weight: 500; color: #334155; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
                    .full { grid-column: span 2; }
                    .rich-text { white-space: pre-wrap; min-height: 60px; }
                    .tags { display: flex; gap: 6px; flex-wrap: wrap; }
                    .tag { font-size: 11px; padding: 2px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-weight: 600; }
                    .footer { margin-top: 50px; font-size: 12px; color: #cbd5e1; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                    @media print { body { padding: 0; } .value { border: none; background: none; padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="title">${viewEvent.title}</h1>
                        <div class="subtitle">
                            ${moment(viewEvent.start).format('D MMMM YYYY, dddd')} | 
                            ${moment(viewEvent.start).format('HH:mm')} - ${moment(viewEvent.end).format('HH:mm')}
                        </div>
                    </div>
                    <div class="status">${viewEvent.status || 'Aktif'}</div>
                </div>

                <div class="grid">
                    <div class="item">
                        <div class="label">Salon</div>
                        <div class="value">${rooms.find(r => r.id === viewEvent.resourceId)?.title || '-'}</div>
                    </div>
                    <div class="item">
                        <div class="label">Düzenleyen</div>
                        <div class="value">${viewEvent.organizer || '-'}</div>
                    </div>
                     <div class="item">
                        <div class="label">İrtibat Kişisi</div>
                        <div class="value">${viewEvent.contactPerson || '-'}</div>
                    </div>
                    <div class="item">
                        <div class="label">İletişim</div>
                        <div class="value">${viewEvent.contactInfo || '-'}</div>
                    </div>
                    <div class="item">
                        <div class="label">Format</div>
                        <div class="value">${viewEvent.format || '-'}</div>
                    </div>
                    <div class="item">
                        <div class="label">Tür</div>
                        <div class="value">${viewEvent.type || '-'}</div>
                    </div>

                    <div class="item full">
                        <div class="label">Gündem / Açıklama</div>
                        <div class="value rich-text">${(viewEvent.desc || viewEvent.agenda || 'Açıklama yok.')}</div>
                    </div>

                    <div class="item full">
                        <div class="label">Katılımcılar</div>
                        <div class="value rich-text">${(viewEvent.participants || 'Liste girilmemiş.')}</div>
                    </div>

                    <div class="item full">
                        <div class="label">Ekipman Talebi</div>
                        <div class="value">
                            <div class="tags">
                                ${(viewEvent.equipment || '').split(',').map(e => `<span class="tag">${e.trim()}</span>`).join('') || '<span style="color:#999;font-style:italic">Yok</span>'}
                            </div>
                        </div>
                    </div>

                    <div class="item">
                        <div class="label">İkram</div>
                        <div class="value">${viewEvent.catering || '-'}</div>
                    </div>
                    <div class="item">
                        <div class="label">Basın</div>
                        <div class="value">${viewEvent.press ? 'Basına Açık' : 'Kapalı'}</div>
                    </div>
                </div>

                <div class="footer">
                    Bu belge ${moment().format('D MMMM YYYY HH:mm')} tarihinde sistemden alınmıştır.
                </div>

                <script>
                    window.onload = () => { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
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

                    {/* Sağ: Tab Butonları ve Aksiyon */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="flex flex-wrap gap-1 bg-white/10 backdrop-blur-sm p-1 rounded-lg border border-white/10 flex-1 sm:flex-none">

                            <button
                                onClick={() => setActiveTab('list')}
                                className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                            >
                                <List className="w-4 h-4" /> <span>Liste & Kararlar</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex-1 sm:flex-none px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === 'admin' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                            >
                                <Settings className="w-4 h-4" /> <span>Salonlar</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setCreatePanelOpen(true)}
                            className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Toplantı Planla</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6">

                {/* SIDEBAR (Only visible on Calendar Tab) */}


                {/* MAIN CONTENT AREA */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden flex flex-col">

                    {/* TAB CONTENT: CALENDAR */}


                    {/* TAB CONTENT: BOOKING */}
                    {/* TAB CONTENT: LIST & DECISIONS */}
                    {activeTab === 'list' && (
                        <div className="h-full overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
                            {/* TOOLBAR */}
                            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
                                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                    <button
                                        onClick={() => setTimeFilter('today')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${timeFilter === 'today' ? "bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                                    >
                                        <CalendarDays className="w-3.5 h-3.5" /> Bugün
                                    </button>
                                    <button
                                        onClick={() => setTimeFilter('week')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${timeFilter === 'week' ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                                    >
                                        <CalendarRange className="w-3.5 h-3.5" /> Bu Hafta
                                    </button>
                                    <button
                                        onClick={() => setTimeFilter('all')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${timeFilter === 'all' ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                                    >
                                        <List className="w-3.5 h-3.5" /> Tümü
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 flex-1 justify-end w-full md:w-auto">
                                    <div className="relative max-w-xs w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Toplantı veya kişi ara..."
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                                    <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 shadow-sm bg-white" title="Yazdır">
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleExportExcel} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg border border-slate-200 shadow-sm bg-white" title="Excel İndir">
                                        <FileSpreadsheet className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* TABLE CONTAINER */}
                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarih</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Saat</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Konu</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Salon</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Düzenleyen</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredEvents.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-12 text-slate-500">
                                                {searchTerm ? 'Arama kriterlerine uygun toplantı bulunamadı.' : 'Bu dönemde toplantı bulunmuyor.'}
                                            </td></tr>
                                        ) : (
                                            filteredEvents
                                                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                                                .map(event => (
                                                    <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="py-4 px-6 text-sm font-medium text-slate-900 whitespace-nowrap">
                                                            {moment(event.start).format('D MMMM YYYY')}
                                                            <div className="text-xs text-slate-400 font-normal">{moment(event.start).format('dddd')}</div>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-slate-600 multiline">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                <span className="font-semibold text-slate-700">{moment(event.start).format('HH:mm')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                                                <span>{moment(event.end).format('HH:mm')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="font-bold text-slate-800 mb-0.5">{event.title}</div>
                                                            {event.isProtocol && <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase tracking-wide">Protokol</span>}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rooms.find(r => r.id === event.resourceId)?.color || '#94a3b8' }}></span>
                                                                {rooms.find(r => r.id === event.resourceId)?.title || 'Bilinmeyen Salon'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-slate-500">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
                                                                    {event.organizer ? event.organizer.substring(0, 2) : '--'}
                                                                </div>
                                                                {event.organizer || '-'}
                                                            </div>

                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <button
                                                                onClick={() => openStatusModal(event)}
                                                                className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border hover:scale-105 transition-transform cursor-pointer ${event.status === 'Onaylandı' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                        event.status === 'Ertelendi' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                            event.status === 'İptal Edildi' || event.status === 'İptal' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                                event.status === 'Tamamlandı' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                                                    }`}>
                                                                {event.status || 'Onay Bekliyor'}
                                                            </button>
                                                            {event.statusReason && (
                                                                <div className="text-[10px] text-slate-400 mt-1 max-w-[150px] truncate" title={event.statusReason}>
                                                                    {event.statusReason}
                                                                </div>
                                                            )}
                                                            {event.status === 'Ertelendi' && event.postponedDate && (
                                                                <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                                                                    {moment(event.postponedDate).format('DD.MM.YYYY')}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => openViewModal(event)}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                    title="Detayları Görüntüle"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => openDocsModal(event.id)}
                                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                    title="Kararlar ve Dosyalar"
                                                                >
                                                                    <Paperclip className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditEvent(event)}
                                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                    title="Toplantıyı Düzenle"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteEvent(event.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                    title="Toplantıyı Sil"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
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

            {/* Toplantı Silme Dialogu */}
            <ConfirmDialog
                open={deleteEventOpen}
                onClose={() => setDeleteEventOpen(false)}
                onConfirm={confirmDeleteEvent}
                title="Toplantıyı Sil"
                message="Bu toplantıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                cancelText="Vazgeç"
                variant="danger"
            />

            {/* Status Update Modal */}
            <Modal
                open={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                title="Durum Güncelle"
                size="md"
            >
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Durum</label>
                        <select
                            className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={statusUpdateData.status}
                            onChange={e => setStatusUpdateData({ ...statusUpdateData, status: e.target.value })}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {(statusUpdateData.status === 'Onaylandı' || statusUpdateData.status === 'Tamamlandı' || statusUpdateData.status === 'Ertelendi') && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                {statusUpdateData.status === 'Onaylandı' ? 'Onaylayan Makam' : 'İşlem Yapan'}
                            </label>
                            <input
                                type="text"
                                className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                placeholder="Örn: Vali Yardımcısı"
                                value={statusUpdateData.approvedBy}
                                onChange={e => setStatusUpdateData({ ...statusUpdateData, approvedBy: e.target.value })}
                            />
                        </div>
                    )}

                    {statusUpdateData.status === 'Ertelendi' && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Ertelenen Tarih</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white h-10 border-slate-200")}>
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                        {statusUpdateData.postponedDate ? format(statusUpdateData.postponedDate, "d MMMM yyyy", { locale: tr }) : <span>Tarih seçin</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <SmallCalendar mode="single" selected={statusUpdateData.postponedDate || undefined} onSelect={(date) => setStatusUpdateData({ ...statusUpdateData, postponedDate: date || null })} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {(statusUpdateData.status === 'Ertelendi' || statusUpdateData.status === 'İptal Edildi' || statusUpdateData.status === 'İptal') && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">
                                {statusUpdateData.status === 'Ertelendi' ? 'Erteleme Nedeni' : 'İptal Nedeni'}
                            </label>
                            <textarea
                                className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none"
                                placeholder="Açıklama giriniz..."
                                value={statusUpdateData.statusReason}
                                onChange={e => setStatusUpdateData({ ...statusUpdateData, statusReason: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setStatusModalOpen(false)}>İptal</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleQuickStatusSave}>Kaydet</Button>
                    </div>
                </div>
            </Modal>

            {/* Create Meeting Modal */}
            <Modal
                open={isCreatePanelOpen}
                onClose={() => setCreatePanelOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        {selectedEventId ? <Edit2 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                        <span>{selectedEventId ? 'Toplantı Düzenle' : 'Yeni Toplantı Planla'}</span>
                    </div>
                }
                size="lg"
            >
                <div className="space-y-6">
                    {/* Toplantı Temel Bilgileri */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Toplantı Konusu</label>
                            <input
                                type="text"
                                className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
                                placeholder="Örn: Haftalık Koordinasyon Toplantısı"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Toplantı Türü</label>
                            <div className="relative">
                                <select
                                    className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all appearance-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="">Seçiniz</option>
                                    {MEETING_TYPES.map((type, index) => (
                                        <option key={index} value={type}>{type}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Salon</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <select
                                    className="w-full border border-slate-200 bg-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all appearance-none"
                                    value={formData.resourceId}
                                    onChange={e => {
                                        const rId = Number(e.target.value);
                                        const room = rooms.find(r => r.id === rId);
                                        setFormData({
                                            ...formData,
                                            resourceId: rId,
                                            equipment: room?.ekipman || ''
                                        });
                                    }}
                                >
                                    <option value={0}>Salon Seçiniz</option>
                                    {rooms.map(room => <option key={room.id} value={room.id}>{room.title}</option>)}
                                </select>
                                <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* İletişim Bilgileri */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                Organizasyon ve İletişim
                            </h4>
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                    checked={isAmirSelection}
                                    onChange={e => setIsAmirSelection(e.target.checked)}
                                />
                                <span className="text-xs text-slate-600 font-medium">Kurum Amirlerinden Seç</span>
                            </label>
                        </div>

                        {isAmirSelection && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                <select
                                    className="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    onChange={e => {
                                        const amir = amirler.find(a => a.id === Number(e.target.value));
                                        if (amir) {
                                            setFormData(prev => ({
                                                ...prev,
                                                organizer: amir.kurum_adi,
                                                contactPerson: amir.ad_soyad,
                                                contactInfo: amir.gsm || amir.email || ''
                                            }));
                                        }
                                    }}
                                >
                                    <option value="">Kurum Amiri Seçiniz...</option>
                                    {amirler.map(amir => (
                                        <option key={amir.id} value={amir.id}>{amir.ad_soyad} ({amir.kurum_adi})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Düzenleyen Birim</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
                                    placeholder="Örn: Bilgi İşlem Şube Md."
                                    value={formData.organizer}
                                    onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                                    disabled={isAmirSelection}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700">İrtibat Kişisi</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
                                    placeholder="Ad Soyad"
                                    value={formData.contactPerson}
                                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                    disabled={isAmirSelection}
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700">İletişim Bilgisi</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
                                    placeholder="Telefon, Dahili veya E-posta"
                                    value={formData.contactInfo}
                                    onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
                                    disabled={isAmirSelection}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Zamanlama */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            <h4 className="text-sm font-bold text-slate-700">Zamanlama</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white h-11 border-slate-200", !bookingDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                            {bookingDate ? format(bookingDate, "d MMMM yyyy, EEEE", { locale: tr }) : <span>Tarih seçin</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <SmallCalendar mode="single" selected={bookingDate} onSelect={setBookingDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Başlangıç</label>
                                    <TimePicker value={startTime} onChange={setStartTime} placeholder="09:00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bitiş</label>
                                    <TimePicker value={endTime} onChange={setEndTime} placeholder="10:00" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tekrar Seçenekleri */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Repeat className="w-4 h-4 text-blue-500" />
                            <h4 className="text-sm font-bold text-slate-700">Tekrar Ayarları</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tekrar Sıklığı</label>
                                <select
                                    className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.recurrence}
                                    onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                                >
                                    <option value="none">Tekrar Yok</option>
                                    <option value="daily">Her Gün</option>
                                    <option value="weekly">Her Hafta</option>
                                    <option value="monthly">Her Ay</option>
                                    <option value="yearly">Her Yıl</option>
                                </select>
                            </div>
                            {formData.recurrence !== 'none' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tekrar Sayısı (Kez)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={formData.repeatCount}
                                        onChange={e => setFormData({ ...formData, repeatCount: Number(e.target.value) })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Toplantı İçeriği ve Detaylar */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <h4 className="text-sm font-bold text-slate-700">İçerik ve Detaylar</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplantı Formatı</label>
                                <select
                                    className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.format}
                                    onChange={e => setFormData({ ...formData, format: e.target.value })}
                                >
                                    <option value="Yüz Yüze">Yüz Yüze</option>
                                    <option value="Online">Online / Video Konferans</option>
                                    <option value="Hibrit">Hibrit (Yüz Yüze + Online)</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Onay Durumu</label>
                                <select
                                    className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>

                            </div>

                        </div>

                        {/* Status Details */}
                        {(formData.status === 'Ertelendi' || formData.status === 'İptal Edildi' || formData.status === 'İptal' || formData.status === 'Onaylandı' || formData.status === 'Tamamlandı') && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                {(formData.status === 'Onaylandı' || formData.status === 'Tamamlandı' || formData.status === 'Ertelendi') && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {formData.status === 'Onaylandı' ? 'Onaylayan Makam' : 'İşlem Yapan / Onaylayan'}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            placeholder="Örn: Vali Yardımcısı"
                                            value={formData.approvedBy}
                                            onChange={e => setFormData({ ...formData, approvedBy: e.target.value })}
                                        />
                                    </div>
                                )}

                                {formData.status === 'Ertelendi' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ertelenme Tarihi</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white h-10 border-slate-200")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                                    {formData.postponedDate ? format(formData.postponedDate, "d MMMM yyyy", { locale: tr }) : <span>Tarih seçin</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <SmallCalendar mode="single" selected={formData.postponedDate || undefined} onSelect={(date) => setFormData({ ...formData, postponedDate: date || null })} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}

                                {(formData.status === 'Ertelendi' || formData.status === 'İptal Edildi' || formData.status === 'İptal') && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            {formData.status === 'Ertelendi' ? 'Erteleme Nedeni' : 'İptal Nedeni'}
                                        </label>
                                        <textarea
                                            className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none h-16 resize-none"
                                            placeholder="Açıklama giriniz..."
                                            value={formData.statusReason}
                                            onChange={e => setFormData({ ...formData, statusReason: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        )}


                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gündem Maddeleri</label>
                            <textarea
                                className="w-full border border-slate-200 bg-white p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none"
                                placeholder="Toplantı gündem maddelerini buraya giriniz..."
                                value={formData.agenda}
                                onChange={e => setFormData({ ...formData, agenda: e.target.value })}
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 25 * 1024 * 1024) {
                                                showToast("Dosya boyutu 25MB'dan büyük olamaz.", "error");
                                                e.target.value = '';
                                            } else {
                                                setAgendaFile(file);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Açıklama / Notlar</label>
                            <textarea
                                className="w-full border border-slate-200 bg-white p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none h-20 resize-none"
                                placeholder="Ek notlar ve açıklamalar..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Lojistik ve İhtiyaçlar */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <LayoutGrid className="w-4 h-4 text-purple-500" />
                            <h4 className="text-sm font-bold text-slate-700">Lojistik ve İhtiyaçlar</h4>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ekipman Talebi</label>
                            <div className="flex flex-wrap gap-2">
                                {STANDARD_EQUIPMENT.map(eq => {
                                    const isSelected = formData.equipment.includes(eq.label);
                                    return (
                                        <button
                                            key={eq.label}
                                            onClick={() => {
                                                const current = formData.equipment ? formData.equipment.split(', ').filter(Boolean) : [];
                                                let updated = [];
                                                if (isSelected) {
                                                    updated = current.filter(i => i !== eq.label);
                                                } else {
                                                    updated = [...current, eq.label];
                                                }
                                                setFormData({ ...formData, equipment: updated.join(', ') });
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${isSelected
                                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 border-transparent text-white shadow-lg scale-[1.02]'
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-purple-200 hover:bg-purple-50'
                                                }`}
                                        >
                                            <span className="text-base">{eq.icon}</span>
                                            {eq.label}
                                            {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.equipment.split(', ').filter(i => i && !STANDARD_EQUIPMENT.some(s => s.label === i)).map((tag, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700">
                                        {tag}
                                        <button onClick={() => {
                                            const current = formData.equipment.split(', ').filter(Boolean);
                                            const updated = current.filter(t => t !== tag).join(', ');
                                            setFormData({ ...formData, equipment: updated });
                                        }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    className="border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:border-indigo-500 w-32"
                                    placeholder="+ Diğer..."
                                    value={customTagInput}
                                    onChange={e => setCustomTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (customTagInput.trim()) {
                                                const current = formData.equipment ? formData.equipment.split(', ').filter(Boolean) : [];
                                                if (!current.includes(customTagInput.trim())) {
                                                    const updated = [...current, customTagInput.trim()].join(', ');
                                                    setFormData({ ...formData, equipment: updated });
                                                }
                                                setCustomTagInput('');
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Listeden seçebilir veya manuel ekleme yapabilirsiniz (Enter ile ekle).</p>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">İkram Talebi</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select
                                    className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                                    value={formData.catering}
                                    onChange={e => setFormData({ ...formData, catering: e.target.value })}
                                >
                                    <option value="">İkram Yok</option>
                                    <option value="Standart Çay/Su">Standart Çay/Su</option>
                                    <option value="Kuruyemiş + İçecek">Kuruyemiş + İçecek</option>
                                    <option value="Kahvaltı Tabağı">Kahvaltı Tabağı</option>
                                    <option value="Yemekli">Yemekli</option>
                                    <option value="Özel">Özel (Manuel Belirtiniz)</option>
                                </select>
                                {formData.catering === 'Özel' && (
                                    <input
                                        type="text"
                                        className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm outline-none"
                                        placeholder="İkram detaylarını giriniz..."
                                        // We need separate state if we want to combine select + text.
                                        // For now, if "Özel" selected, user creates custom text? 
                                        // Let's just use a text input that Defaults to Dropdown value.
                                        // Better: Dropdown sets the Text Input value.
                                        onChange={e => setFormData({ ...formData, catering: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Katılımcılar ve Basın */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <h4 className="text-sm font-bold text-slate-700">Katılımcılar ve Basın</h4>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Katılımcı Listesi</label>
                            <textarea
                                className="w-full border border-slate-200 bg-white p-3 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 outline-none h-24 resize-none"
                                placeholder="Katılımcı isimlerini buraya girebilirsiniz..."
                                value={formData.participants}
                                onChange={e => setFormData({ ...formData, participants: e.target.value })}
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all cursor-pointer"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 25 * 1024 * 1024) {
                                                showToast("Dosya boyutu 25MB'dan büyük olamaz.", "error");
                                                e.target.value = '';
                                            } else {
                                                setParticipantFile(file);
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400">Liste dosyası yükleyebilir (.xlsx, .pdf) veya metin olarak girebilirsiniz.</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer select-none mb-2">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500" checked={formData.press} onChange={e => setFormData({ ...formData, press: e.target.checked })} />
                                <span className="text-sm text-slate-700 font-medium">Toplantıda Basın / Fotoğrafçı olacak</span>
                            </label>

                            {formData.press && (
                                <div className="ml-7 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                            className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all cursor-pointer"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 25 * 1024 * 1024) {
                                                        showToast("Dosya boyutu 25MB'dan büyük olamaz.", "error");
                                                        e.target.value = '';
                                                    } else {
                                                        setPressFile(file);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Basın bülteni veya medya dosyası (25MB max).</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100/50">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500" checked={formData.isProtocol} onChange={e => setFormData({ ...formData, isProtocol: e.target.checked })} />
                            <span className="text-red-700 font-bold text-sm">PROTOKOL (VALİLİK MAKAMI)</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <Button variant="ghost" className="flex-1" onClick={() => setCreatePanelOpen(false)}>
                            İptal
                        </Button>
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveBooking}>
                            Toplantıyı Oluştur
                        </Button>
                    </div>
                </div >
            </Modal >

            {/* Create Meeting Drawer */}
            {/* Drawer Disabled in favor of Modal */ false && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity" onClick={() => setCreatePanelOpen(false)} />
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white z-[70] shadow-2xl transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-600" />
                                Yeni Toplantı Planla
                            </h2>
                            <button onClick={() => setCreatePanelOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Toplantı Konusu</label>
                                <input type="text" className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Düzenleyen Birim</label>
                                <input type="text" className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm" value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Salon</label>
                                <select className="w-full border border-slate-200 bg-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm" value={formData.resourceId} onChange={e => setFormData({ ...formData, resourceId: Number(e.target.value) })}>
                                    {rooms.map(room => <option key={room.id} value={room.id}>{room.title}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Toplantı Tarihi</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white h-11 border-slate-200", !bookingDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                                {bookingDate ? format(bookingDate, "d MMMM yyyy, EEEE", { locale: tr }) : <span>Tarih seçin</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <SmallCalendar mode="single" selected={bookingDate} onSelect={setBookingDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Başlangıç</label>
                                        <TimePicker value={startTime} onChange={setStartTime} placeholder="Seçiniz" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Bitiş</label>
                                        <TimePicker value={endTime} onChange={setEndTime} placeholder="Seçiniz" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100/50">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input type="checkbox" className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500" checked={formData.isProtocol} onChange={e => setFormData({ ...formData, isProtocol: e.target.checked })} />
                                    <span className="text-red-700 font-bold text-sm">PROTOKOL (VALİLİK MAKAMI)</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                            <button onClick={() => setCreatePanelOpen(false)} className="flex-1 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors">Vazgeç</button>
                            <button onClick={handleSaveBooking} className={`flex-1 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${selectedEventId ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}>
                                {selectedEventId ? 'Güncelle' : 'Oluştur'}
                            </button>
                        </div>
                    </div>
                </>
            )
            }

            {/* DOCUMENTS MODAL */}
            {
                docsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Toplantı Belgeleri</h3>
                                        <p className="text-xs text-slate-500">Toplantı kararları ve ekli dosyalar</p>
                                    </div>
                                </div>
                                <button onClick={() => setDocsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-0 overflow-y-auto flex-1 bg-slate-50/30">
                                {currentDocs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <FileText className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm">Henüz eklenmiş belge yok.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {currentDocs.map(doc => (
                                            <div key={doc.id} className="p-4 hover:bg-white transition-colors flex items-center gap-3 group">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{doc.dosya_adi}</p>
                                                    <p className="text-xs text-slate-400">{(doc.dosya_boyut / 1024).toFixed(1)} KB • {moment(doc.yukleme_tarihi).format('DD.MM.YYYY HH:mm')}</p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={doc.dosya_yolu} download target="_blank" rel="noreferrer" className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="İndir">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="Sil">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-white">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    <span>{isUploading ? 'Yükleniyor...' : 'Yeni Belge / Karar Ekle'}</span>
                                </button>
                                <p className="text-[10px] text-slate-400 text-center mt-2">
                                    PDF, Word, Excel, Görsel (.jpg, .png) desteklenir. Maksimum 25MB.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* VIEW DETAILS MODAL */}
            <Modal
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Toplantı Detayları"
                size="lg"
            >
                {viewEvent && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex items-start justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{viewEvent.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                        {moment(viewEvent.start).format('D MMMM YYYY')}
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        {moment(viewEvent.start).format('HH:mm')} - {moment(viewEvent.end).format('HH:mm')}
                                    </div>
                                </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border ${viewEvent.status === 'İptal' ? 'bg-red-50 text-red-600 border-red-100' : viewEvent.status === 'Beklemede' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                {viewEvent.status || 'Aktif'}
                            </div>
                        </div>

                        {/* Grid Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-1">

                            <div className="col-span-1 space-y-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <MapPin className="w-3.5 h-3.5" /> Salon
                                </label>
                                <p className="text-sm font-semibold text-slate-800 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                                    {rooms.find(r => r.id === viewEvent.resourceId)?.title || 'Belirtilmemiş'}
                                </p>
                            </div>

                            <div className="col-span-1 space-y-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <User className="w-3.5 h-3.5" /> Düzenleyen
                                </label>
                                <p className="text-sm font-semibold text-slate-800 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                                    {viewEvent.organizer || '-'}
                                </p>
                            </div>

                            <div className="col-span-1 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">İrtibat Kişisi</label>
                                <p className="text-sm text-slate-700">{viewEvent.contactPerson || '-'}</p>
                            </div>

                            <div className="col-span-1 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">İletişim</label>
                                <p className="text-sm text-slate-700">{viewEvent.contactInfo || '-'}</p>
                            </div>

                            <div className="col-span-1 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplantı Formatı</label>
                                <p className="text-sm text-slate-700">{viewEvent.format || 'Yüz Yüze'}</p>
                            </div>

                            <div className="col-span-1 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplantı Türü</label>
                                <p className="text-sm text-slate-700">{viewEvent.type || 'Makam Toplantısı'}</p>
                            </div>

                            {/* Full Width Fields */}
                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gündem / Açıklama</label>
                                <div className="text-sm text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[60px] whitespace-pre-wrap">
                                    {viewEvent.desc || viewEvent.agenda || 'Açıklama yok.'}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Katılımcılar</label>
                                <div className="text-sm text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[60px] whitespace-pre-wrap">
                                    {viewEvent.participants || 'Katılımcı listesi girilmemiş.'}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Talep Edilen Ekipman</label>
                                <div className="flex flex-wrap gap-2">
                                    {viewEvent.equipment ? viewEvent.equipment.split(',').map((eq, i) => (
                                        <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-100">
                                            {eq.trim()}
                                        </span>
                                    )) : <span className="text-sm text-slate-400 italic">Ekipman talebi yok</span>}
                                </div>
                            </div>

                            <div className="col-span-1 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">İkram Talebi</label>
                                <p className="text-sm text-slate-700">{viewEvent.catering || '-'}</p>
                            </div>

                            <div className="col-span-1 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Basın Durumu</label>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ekli Dosyalar</label>
                                <div className="space-y-2">
                                    {viewEvent.documents && viewEvent.documents.length > 0 ? (
                                        viewEvent.documents.map((doc: any) => (
                                            <a key={doc.id} href={doc.dosya_yolu} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors group">
                                                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-700">{doc.dosya_adi}</p>
                                                    <p className="text-[10px] text-slate-400">{(doc.dosya_boyut / 1024).toFixed(0)} KB</p>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-400 italic p-2">Ekli dosya yok.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            <Button variant="outline" onClick={handlePrintDetail}>
                                <Printer className="w-4 h-4 mr-2" /> Yazdır
                            </Button>
                            <Button onClick={() => setViewModalOpen(false)}>Kapat</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}

