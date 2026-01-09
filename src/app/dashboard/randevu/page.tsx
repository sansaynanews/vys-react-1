"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Calendar, Plus, Search, Clock, User, Building2,
  Phone, MessageSquare, CheckCircle2, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Edit2, Trash2, Sparkles,
  Users, CalendarCheck, CalendarClock, ChevronDown, ChevronUp,
  MoreHorizontal, Eye, CalendarDays, CalendarRange, List,
  LayoutList, Calendar as CalendarIcon, UserCheck, DoorOpen, Play, Square, FileEdit, ClipboardList, AlertOctagon, UserMinus, Printer,
  PauseCircle, ArrowRightCircle, History, CalendarX, UserX, Armchair, CheckCheck, FileSpreadsheet
} from "lucide-react";
import isoWeek from "dayjs/plugin/isoWeek";
import RandevuModal from "./RandevuModal";
import RandevuCalendarView, { ViewMode } from "./RandevuCalendarView";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToastStore } from "@/hooks/useToastStore";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/Calendar";
import { cn } from "@/lib/utils";
import { getStatusConfig, APPOINTMENT_STATUS } from "@/lib/constants";
import StatsGrid from "./StatsGrid";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

dayjs.extend(isoWeek);
dayjs.locale("tr");

type DateRangeType = "today" | "week" | "all";

interface Randevu {
  id: number;
  ad_soyad: string | null;
  kurum: string | null;
  unvan: string | null;
  iletisim: string | null;
  amac: string | null;
  tarih: string | null;
  saat: string | null;
  durum: string | null;
  notlar: string | null;
  sonuc_notlari: string | null;
  talep_kaynagi: string | null;
  created_at: string | null;
  // İş Akışı alanları
  yonlendirilen_birim: string | null;
  yonlendirme_nedeni: string | null;
  ret_gerekcesi: string | null;
  havale_edilen: string | null;
  havale_nedeni: string | null;
  iptal_gerekcesi: string | null;
  // Süre takibi alanları
  giris_saati: string | null;
  gorusme_baslangic: string | null;
  cikis_saati: string | null;
  giris_tarihi: string | null;
  talimatlar?: any[]; // İlişkili talimatlar
}

export default function RandevuPage() {
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRandevu, setSelectedRandevu] = useState<Randevu | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"liste" | "takvim">("liste");
  const [calendarViewMode, setCalendarViewMode] = useState<ViewMode>("day");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Görüşme Sonuç Notu Modal
  const [sonucNotuModalOpen, setSonucNotuModalOpen] = useState(false);
  const [sonucNotuTarget, setSonucNotuTarget] = useState<Randevu | null>(null);
  const [sonucNotu, setSonucNotu] = useState("");

  // Talimat Oluşturma Modal
  const [talimatModalOpen, setTalimatModalOpen] = useState(false);
  const [talimatTarget, setTalimatTarget] = useState<Randevu | null>(null);
  const [talimatForm, setTalimatForm] = useState({
    konu: "",
    verilen_kisi: "Vali",
    kurum: "",
    icerik: "",
    onem_derecesi: "Normal",
    tarih: ""
  });

  // Filters
  const [search, setSearch] = useState("");
  const [filterTarih, setFilterTarih] = useState(dayjs().format("YYYY-MM-DD"));
  const [filterDurum, setFilterDurum] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeType>("today");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Delegation & Visitor Reschedule State
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [delegateTarget, setDelegateTarget] = useState<Randevu | null>(null);
  const [delegateForm, setDelegateForm] = useState({ person: "", note: "", type: "" });
  const [managers, setManagers] = useState<any[]>([]);

  const [rescheduleVisitorModalOpen, setRescheduleVisitorModalOpen] = useState(false);
  const [rescheduleVisitorTarget, setRescheduleVisitorTarget] = useState<Randevu | null>(null);
  const [rescheduleVisitorForm, setRescheduleVisitorForm] = useState({ reason: "" });

  useEffect(() => {
    fetch("/api/kurum-amirleri").then(res => res.json()).then(data => {
      if (data.data) setManagers(data.data);
    }).catch(err => console.error("Managers fetch error", err));
  }, []);
  const pageSize = 25; // More items per page for table view

  useEffect(() => {
    // Fetch data whenever filters or view mode changes
    // Both list and calendar need data now
    fetchRandevular();
  }, [currentPage, search, filterTarih, filterDurum, dateRange, viewMode]);

  const fetchRandevular = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (search) params.append("search", search);

      // Date range filtering - skip for calendar view (it does its own filtering)
      if (viewMode === "takvim") {
        // Fetch all appointments for calendar view to filter client-side
        params.set("limit", "100"); // Increase limit for calendar
      } else if (dateRange === "today") {
        params.append("tarih", filterTarih);
      } else if (dateRange === "week") {
        const weekStart = dayjs().startOf("isoWeek").format("YYYY-MM-DD");
        const weekEnd = dayjs().endOf("isoWeek").format("YYYY-MM-DD");
        params.append("startDate", weekStart);
        params.append("endDate", weekEnd);
      }
      // "all" = no date filter

      if (filterDurum) params.append("durum", filterDurum);

      const response = await fetch(`/api/randevu?${params}`);
      const data = await response.json();

      if (data.data) {
        setRandevular(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Randevular getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (randevu: Randevu) => {
    setSelectedRandevu(randevu);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRandevu(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRandevu(null);
  };

  const handleSuccess = () => {
    fetchRandevular();
    handleModalClose();
  };

  /* Excel Export */
  const handleExportExcel = () => {
    // CSV Header with BOM for Excel UTF-8 support
    let csvContent = "\uFEFFTarih;Saat;Ad Soyad;Unvan;Kurum;Konu;Durum;Notlar;Diğer Katılımcılar\n";

    randevular.forEach(r => {
      const tarih = r.tarih ? dayjs(r.tarih).format("DD.MM.YYYY") : "";
      const saat = r.saat || "";
      const ad = `"${(r.ad_soyad || "").replace(/"/g, '""')}"`;
      const unvan = `"${(r.unvan || "").replace(/"/g, '""')}"`;
      const kurum = `"${(r.kurum || "").replace(/"/g, '""')}"`;
      const konu = `"${(r.amac || "").replace(/"/g, '""')}"`;

      const config = getStatusConfig(r.durum);
      const durumLabel = config ? config.label : (r.durum || "");
      const durum = `"${durumLabel.replace(/"/g, '""')}"`;

      // Parse Notes vs Participants
      let notRaw = r.notlar || "";
      let digerKatilimcilar = "";
      const splitter = "Diğer Katılımcılar: ";

      if (notRaw.includes(splitter)) {
        const parts = notRaw.split(splitter);
        // The last part is likely the participants if appended at end
        // But to be safe if multiple splits, take the last one or handle carefully
        // Usually it's appended at the end: "Note text... \n\nDiğer Katılımcılar: a, b"
        if (parts.length > 1) {
          digerKatilimcilar = parts.pop() || "";
          notRaw = parts.join(splitter).trim();
        }
      }

      const notlar = `"${notRaw.replace(/"/g, '""')}"`;
      const katilimcilar = `"${digerKatilimcilar.replace(/"/g, '""')}"`;

      csvContent += `${tarih};${saat};${ad};${unvan};${kurum};${konu};${durum};${notlar};${katilimcilar}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Randevu_Listesi_${dayjs().format("DD-MM-YYYY")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* Postpone Modal State & Logic */
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [postponeTarget, setPostponeTarget] = useState<Randevu | null>(null);
  const [postponeReason, setPostponeReason] = useState("");
  const [postponeDate, setPostponeDate] = useState<Date | undefined>(undefined);
  const [postponeTime, setPostponeTime] = useState("");

  /* Cancel Modal State & Logic */
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Randevu | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { showToast } = useToastStore();

  const handleStatusUpdate = async (id: number, newStatus: string, currentRandevu: Randevu) => {
    // Smart Approve: Force Date Entry if missing
    if (newStatus === APPOINTMENT_STATUS.APPROVED.id && (!currentRandevu.tarih || !currentRandevu.saat)) {
      showToast("Onaylamak için lütfen önce Tarih ve Saat belirleyin.", "info");
      setSelectedRandevu({ ...currentRandevu, durum: newStatus });
      setModalOpen(true);
      return;
    }

    // Delegation Handlers
    if ([APPOINTMENT_STATUS.DELEGATED_UNIT.id, APPOINTMENT_STATUS.DELEGATED_SUB.id].includes(newStatus as any)) {
      setDelegateTarget(currentRandevu);
      setDelegateForm({ person: "", note: "", type: newStatus });
      setDelegateModalOpen(true);
      return;
    }

    // Visitor Reschedule Handler
    if (newStatus === APPOINTMENT_STATUS.RESCHEDULE_REQ_VISITOR.id) {
      setRescheduleVisitorTarget(currentRandevu);
      setRescheduleVisitorForm({ reason: "" });
      setRescheduleVisitorModalOpen(true);
      return;
    }
    if (newStatus === APPOINTMENT_STATUS.RESCHEDULED_HOST.id) {
      setPostponeTarget(currentRandevu);
      setPostponeModalOpen(true);
      // Reset postpone form
      setPostponeReason("");
      setPostponeDate(undefined);
      setPostponeTime("");
      return;
    }

    if (newStatus === APPOINTMENT_STATUS.REJECTED.id) {
      setCancelTarget(currentRandevu);
      setCancelModalOpen(true);
      // Reset cancel form
      setCancelReason("");
      return;
    }

    try {
      const response = await fetch(`/api/randevu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: newStatus, iptal_gerekcesi: "" }),
      });

      if (!response.ok) throw new Error("Durum güncellenemedi");

      fetchRandevular();
      showToast("Durum güncellendi", "success");
    } catch (error) {
      console.error("Status update error", error);
      showToast("Güncelleme hatası", "error");
    }
  };

  // Misafir Geldi - Fiziksel olarak binaya giriş yaptı
  const handleMisafirGeldi = async (randevu: Randevu) => {
    try {
      const now = new Date();
      const girisTime = format(now, "HH:mm");
      const girisTarih = format(now, "yyyy-MM-dd");

      const response = await fetch(`/api/randevu/${randevu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giris_saati: girisTime,
          giris_tarihi: girisTarih,
          durum: "Kapıda Bekliyor"
        }),
      });

      if (!response.ok) throw new Error("Giriş kaydedilemedi");

      fetchRandevular();
      showToast(`${randevu.ad_soyad} geldi olarak işaretlendi`, "success");
    } catch (error) {
      console.error("Misafir geldi hatası:", error);
      showToast("İşlem başarısız", "error");
    }
  };

  // Görüşme Başladı - Makama alındı
  const handleGorusmeBasladi = async (randevu: Randevu) => {
    try {
      const now = new Date();
      const gorusmeBaslangicTime = format(now, "HH:mm");

      const response = await fetch(`/api/randevu/${randevu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: "Görüşmede",
          gorusme_baslangic: gorusmeBaslangicTime
        }),
      });

      if (!response.ok) throw new Error("Durum güncellenemedi");

      fetchRandevular();
      showToast("Görüşme başladı", "success");
    } catch (error) {
      console.error("Görüşme başlama hatası:", error);
      showToast("İşlem başarısız", "error");
    }
  };

  // Görüşme Bitti - Sonuç notu modal'ını aç
  const handleGorusmeBitti = (randevu: Randevu) => {
    setSonucNotuTarget(randevu);
    setSonucNotu(randevu.sonuc_notlari || "");
    setSonucNotuModalOpen(true);
  };

  // Sonuç Notu Modal Submit
  const handleSonucNotuSubmit = async () => {
    if (!sonucNotuTarget) return;

    try {
      setLoading(true);
      const now = new Date();
      const cikisTime = format(now, "HH:mm");

      const response = await fetch(`/api/randevu/${sonucNotuTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cikis_saati: cikisTime,
          durum: "Görüşüldü",
          sonuc_notlari: sonucNotu || null
        }),
      });

      if (!response.ok) throw new Error("İşlem başarısız");

      fetchRandevular();
      showToast("Görüşme tamamlandı ve notlar kaydedildi", "success");
      setSonucNotuModalOpen(false);
      setSonucNotuTarget(null);
      setSonucNotu("");
    } catch (error) {
      console.error("Görüşme bitirme hatası:", error);
      showToast("İşlem başarısız", "error");
    } finally {
      setLoading(false);
    }
  };

  // Talimat Oluşturma - Modal aç
  const handleTalimatOlustur = (randevu: Randevu) => {
    setTalimatTarget(randevu);
    setTalimatForm({
      konu: "",
      verilen_kisi: "Vali",
      kurum: "", // Talimatın verileceği birim (kullanıcı seçecek)
      icerik: `${randevu.ad_soyad} (${randevu.kurum}) ile yapılan görüşme sonrasında:\n\n`,
      onem_derecesi: "Normal",
      tarih: format(new Date(), "yyyy-MM-dd") // Bugünün tarihi
    });
    setTalimatModalOpen(true);
  };

  // Talimat Submit
  const handleTalimatSubmit = async () => {
    if (!talimatTarget || !talimatForm.konu.trim() || !talimatForm.kurum.trim()) {
      showToast("Konu ve İlgili Birim alanları zorunludur", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/talimatlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...talimatForm,
          randevu_id: talimatTarget.id,
          randevu_bilgi: `${talimatTarget.ad_soyad} - ${talimatTarget.kurum}`
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Talimat oluşturulamadı");
      }

      showToast("Talimat başarıyla oluşturuldu", "success");
      setTalimatModalOpen(false);
      setTalimatTarget(null);
      setTalimatForm({
        konu: "",
        verilen_kisi: "Vali",
        kurum: "",
        icerik: "",
        onem_derecesi: "Normal",
        tarih: ""
      });
    } catch (error) {
      console.error("Talimat oluşturma hatası:", error);
      showToast(error instanceof Error ? error.message : "İşlem başarısız", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bekleme süresi hesapla (dakika)
  const calculateWaitingTime = (giris_saati: string | null): number => {
    if (!giris_saati) return 0;
    const [h, m] = giris_saati.split(":").map(Number);
    const girisDate = new Date();
    girisDate.setHours(h, m, 0, 0);
    const now = new Date();
    return Math.floor((now.getTime() - girisDate.getTime()) / 60000);
  };

  const formatWaitingTime = (minutes: number): string => {
    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} sa ${mins} dk`;
  };

  const handlePostponeSubmit = async () => {
    if (!postponeTarget || !postponeDate || !postponeTime || !postponeReason) {
      showToast("Lütfen tüm alanları doldurun", "error");
      return;
    }

    try {
      setLoading(true);
      // 1. Update Old
      const postponeNote = `\n\n[ERTELENDİ] Nedeni: ${postponeReason}\nYeni Randevu Tarihi: ${format(postponeDate, "dd.MM.yyyy")} ${postponeTime}`;
      await fetch(`/api/randevu/${postponeTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: APPOINTMENT_STATUS.RESCHEDULED_HOST.id,
          notlar: (postponeTarget.notlar || "") + postponeNote
        }),
      });

      // 2. Create New
      const formattedNewDate = format(postponeDate, "yyyy-MM-dd");
      await fetch("/api/randevu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_soyad: postponeTarget.ad_soyad,
          kurum: postponeTarget.kurum,
          unvan: postponeTarget.unvan,
          iletisim: postponeTarget.iletisim,
          amac: postponeTarget.amac,
          tarih: formattedNewDate,
          saat: postponeTime,
          durum: APPOINTMENT_STATUS.APPROVED.id,
          notlar: `(Ertelenen Randevu)\nÖnceki Tarih: ${postponeTarget.tarih}\n\n` + (postponeTarget.notlar || ""),
          katilimci: 1, // Default or fetch if available (simpler for now)
          tipi: "Randevu"
        }),
      });

      showToast("Randevu ertelendi ve yeni kayıt oluşturuldu", "success");
      setPostponeModalOpen(false);
      fetchRandevular();
    } catch (error) {
      showToast("Erteleme işlemi başarısız", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelTarget || !cancelReason.trim()) {
      showToast("Lütfen iptal nedenini belirtin", "error");
      return;
    }

    try {
      setLoading(true);
      await fetch(`/api/randevu/${cancelTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: APPOINTMENT_STATUS.REJECTED.id,
          iptal_gerekcesi: cancelReason
        }),
      });

      showToast("Randevu iptal edildi", "success");
      setCancelModalOpen(false);
      fetchRandevular();
    } catch (error) {
      showToast("İptal işlemi başarısız", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelegateSubmit = async () => {
    if (!delegateTarget || !delegateForm.person) {
      showToast("Lütfen birim/kişi seçiniz", "error");
      return;
    }
    try {
      setLoading(true);
      const manager = managers.find(m => m.id.toString() === delegateForm.person);
      const personString = manager ? `${manager.kurum_adi} - ${manager.ad_soyad}` : delegateForm.person;

      await fetch(`/api/randevu/${delegateTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: delegateForm.type,
          yonlendirilen_birim: personString,
          notlar: (delegateTarget.notlar || "") + `\n\n[YÖNLENDİRİLDİ] -> ${personString}: ${delegateForm.note}`
        })
      });
      showToast("Randevu yönlendirildi ve talimat oluşturuldu", "success");
      setDelegateModalOpen(false);
      fetchRandevular();
    } catch (e) {
      showToast("İşlem başarısız", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleVisitorSubmit = async () => {
    if (!rescheduleVisitorTarget || !rescheduleVisitorForm.reason) {
      showToast("Lütfen gerekçe belirtin", "error");
      return;
    }
    try {
      setLoading(true);
      await fetch(`/api/randevu/${rescheduleVisitorTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durum: APPOINTMENT_STATUS.RESCHEDULE_REQ_VISITOR.id,
          notlar: (rescheduleVisitorTarget.notlar || "") + `\n\n[ZİYARETÇİ ERTELEME TALEBİ] ${rescheduleVisitorForm.reason}`
        })
      });
      showToast("Talep kaydedildi", "success");
      setRescheduleVisitorModalOpen(false);
      fetchRandevular();
    } catch (e) {
      showToast("İşlem başarısız", "error");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/randevu/${deleteId}`, { method: "DELETE" });
      fetchRandevular();
      showToast("Randevu silindi", "success");
    } catch (error) {
      console.error("Silme hatası:", error);
      showToast("Silme işlemi başarısız", "error");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const goToPrevDay = () => setFilterTarih(dayjs(filterTarih).subtract(1, "day").format("YYYY-MM-DD"));
  const goToNextDay = () => setFilterTarih(dayjs(filterTarih).add(1, "day").format("YYYY-MM-DD"));
  const goToToday = () => {
    setFilterTarih(dayjs().format("YYYY-MM-DD"));
    setDateRange("today");
  };
  const isToday = dayjs(filterTarih).isSame(dayjs(), "day");

  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRange(range);
    setCurrentPage(1);
    if (range === "today") {
      setFilterTarih(dayjs().format("YYYY-MM-DD"));
    }
  };

  const getDateRangeLabel = () => {
    // In Calendar Mode, the component handles date label, but for header logic:
    if (viewMode === "takvim") return "Ajanda Görünümü";

    switch (dateRange) {
      case "today":
        return dayjs(filterTarih).format("DD MMMM YYYY, dddd");
      case "week":
        return `${dayjs().startOf("isoWeek").format("DD MMM")} - ${dayjs().endOf("isoWeek").format("DD MMM YYYY")}`;
      case "all":
        return "Tüm Randevular";
    }
  };

  const getDurumConfig = (durum: string | null) => {
    const config = getStatusConfig(durum);

    // Icon Mapping
    const icons: any = {
      Clock, PauseCircle, XCircle, ArrowRightCircle, CalendarClock,
      CheckCircle2, History, CalendarX, UserX, Armchair, Users, CheckCheck,
      UserCheck, Building2, AlertOctagon, UserMinus, DoorOpen, Play, Square, AlertCircle, CalendarCheck
    };

    const IconComponent = icons[config.icon as string] || AlertCircle;

    // Extract colors from config.color string (e.g. "bg-blue-100 text-blue-800 border-blue-200")
    const bgClass = config.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-100';
    const textClass = config.color.split(' ').find(c => c.startsWith('text-')) || 'text-slate-700';
    const borderClass = config.color.split(' ').find(c => c.startsWith('border-')) || 'border-slate-200';

    // Derive dot color from text color (e.g. text-blue-800 -> bg-blue-500)
    const colorName = textClass.split('-')[1] || 'slate';
    const dotClass = `bg-${colorName}-500`;

    return {
      bg: bgClass,
      border: borderClass,
      text: textClass,
      dot: dotClass,
      icon: IconComponent,
      label: config.label
    };
  };

  // Stats - only 3 cards now
  // Stats - Calculated based on current view
  const stats = {
    total: randevular.length, // Oran hesabı için

    // 1. Kart: Onaylı (Kesinleşmiş veya Tarih Bekleyen)
    onayli: randevular.filter(r => {
      const id = getStatusConfig(r.durum).id;
      return [
        APPOINTMENT_STATUS.APPROVED.id,
        APPOINTMENT_STATUS.APPROVED_WAITING_DATE.id,
        APPOINTMENT_STATUS.RESCHEDULED_HOST.id
      ].includes(id as any);
    }).length,

    // 2. Kart: Bekleyen (Sadece Karar Verilmesi Gerekenler) - Red ve Yönlendirilenler ÇIKARILDI
    bekleyen: randevular.filter(r => {
      const id = getStatusConfig(r.durum).id;
      return [
        APPOINTMENT_STATUS.PENDING_APPROVAL.id,
        APPOINTMENT_STATUS.RESCHEDULE_REQ_VISITOR.id,
        APPOINTMENT_STATUS.ON_HOLD.id
      ].includes(id as any);
    }).length,

    // 3. Kart: Tamamlanan
    tamamlandi: randevular.filter(r => getStatusConfig(r.durum).id === APPOINTMENT_STATUS.COMPLETED.id).length,
  };

  const getFilteredStats = () => {
    if (viewMode === "liste") return randevular;

    if (viewMode === "takvim") {
      const targetDate = dayjs(filterTarih);
      if (calendarViewMode === "day") {
        return randevular.filter(r => r.tarih === targetDate.format("YYYY-MM-DD"));
      } else if (calendarViewMode === "week") {
        const start = targetDate.startOf("isoWeek");
        const end = targetDate.endOf("isoWeek");
        return randevular.filter(r => {
          if (!r.tarih) return false;
          const d = dayjs(r.tarih);
          return (d.isSame(start, 'day') || d.isAfter(start)) && (d.isSame(end, 'day') || d.isBefore(end));
        });
      } else {
        return randevular.filter(r => {
          if (!r.tarih) return false;
          const d = dayjs(r.tarih);
          return d.year() === targetDate.year() && d.month() === targetDate.month();
        });
      }
    }
    return randevular;
  };

  // Skeleton for table rows
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-4 w-40 bg-slate-200 rounded"></div></td>
      <td className="px-4 py-4"><div className="h-6 w-20 bg-slate-200 rounded-full"></div></td>
      <td className="px-4 py-4"><div className="h-8 w-8 bg-slate-200 rounded"></div></td>
    </tr>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-4">
      {/* Premium Dashboard Card - Unified Header & Stats */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 animate-gradient-x rounded-2xl p-6 shadow-2xl border border-white/5">

        {/* Header Section */}
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-white">Makam Yönetim Sistemi</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Randevu Yönetimi</h1>
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Navigation (Moved back to right, left of View Switcher) */}
            {viewMode === "liste" && dateRange === "today" && (
              <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-white/10">
                <button
                  onClick={goToPrevDay}
                  className="p-1.5 rounded-md text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-all cursor-pointer text-xs font-medium text-white min-w-[90px] justify-center">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                      <span>{dayjs(filterTarih).format("DD MMM")}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <CalendarComponent
                      mode="single"
                      selected={new Date(filterTarih)}
                      onSelect={(date) => date && setFilterTarih(dayjs(date).format("YYYY-MM-DD"))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <button
                  onClick={goToNextDay}
                  className="p-1.5 rounded-md text-white hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setViewMode("liste")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === "liste" ? "bg-white/20 text-white shadow-sm" : "text-white hover:bg-white/10"
                )}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Liste
              </button>
              <button
                onClick={() => setViewMode("takvim")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === "takvim" ? "bg-white/20 text-white shadow-sm" : "text-white hover:bg-white/10"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Takvim
              </button>
            </div>


          </div>
        </div>

        {/* Stats Cards - Modern Metallic (Copper) Series */}
        <StatsGrid randevular={getFilteredStats()} />
        {/* Old Static Grid Hidden */}
        <div className="hidden relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Card 1: Onaylı Randevular - Mavi/Yeşil Tema */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="group relative overflow-hidden rounded-2xl p-5 border border-blue-500/20 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-900/20 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-blue-200/80 text-xs font-bold uppercase tracking-wider mb-1">Onaylanan Randevular</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-blue-200 to-cyan-100">{stats.onayli}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/10">
                    <CalendarCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-blue-200 shadow-2xl" align="start">
              {(() => {
                const list = randevular.filter(r => [
                  APPOINTMENT_STATUS.APPROVED.id,
                  APPOINTMENT_STATUS.APPROVED_WAITING_DATE.id,
                  APPOINTMENT_STATUS.RESCHEDULED_HOST.id
                ].includes(getStatusConfig(r.durum).id as any));
                return (
                  <div className="bg-white rounded-md overflow-hidden">
                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-blue-800 uppercase">Onaylı Liste</h4>
                      <span className="text-[10px] bg-white border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">{list.length}</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1 space-y-1">
                      {list.length > 0 ? list.map(r => (
                        <div key={r.id} className="p-2 hover:bg-blue-50/30 rounded border border-transparent hover:border-blue-100 transition-colors">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm text-slate-800 line-clamp-1">{r.ad_soyad}</span>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1 rounded">{r.saat || "Saat Yok"}</span>
                          </div>
                          <div className="text-[11px] text-blue-600 mt-0.5">{getStatusConfig(r.durum).label}</div>
                        </div>
                      )) : <div className="p-4 text-center text-xs text-slate-400">Onaylı randevu yok</div>}
                    </div>
                  </div>
                )
              })()}
            </PopoverContent>
          </Popover>

          {/* Card 2: Bekleyen Talepler - Orange/Gold */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="group relative overflow-hidden rounded-2xl p-5 border border-orange-500/30 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/60 hover:shadow-lg hover:shadow-orange-700/20 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-orange-200/80 text-xs font-bold uppercase tracking-wider mb-1">Bekleyen Talepler</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-amber-200 to-yellow-100">{stats.bekleyen}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-600/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/10">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
                {/* Warning Pulse for Pending */}
                {stats.bekleyen > 0 && (
                  <div className="absolute top-3 right-3 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-orange-200 shadow-2xl" align="start">
              {(() => {
                const list = randevular.filter(r => [
                  APPOINTMENT_STATUS.PENDING_APPROVAL.id,
                  APPOINTMENT_STATUS.RESCHEDULE_REQ_VISITOR.id,
                  APPOINTMENT_STATUS.ON_HOLD.id
                ].includes(getStatusConfig(r.durum).id as any));
                return (
                  <div className="bg-white rounded-md overflow-hidden">
                    <div className="bg-orange-50 px-3 py-2 border-b border-orange-100 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-orange-800 uppercase">Bekleyen Talepler</h4>
                      <span className="text-[10px] bg-white border border-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full">{list.length}</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1 space-y-1">
                      {list.length > 0 ? list.map(r => (
                        <div key={r.id} className="p-2 hover:bg-orange-50/50 rounded border border-transparent hover:border-orange-100 transition-colors">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm text-slate-800 line-clamp-1">{r.ad_soyad}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white border border-slate-100 text-slate-600 shadow-sm ml-2">{getStatusConfig(r.durum).label}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{r.amac}</div>
                        </div>
                      )) : <div className="p-4 text-center text-xs text-slate-400">Bekleyen talep yok</div>}
                    </div>
                  </div>
                )
              })()}
            </PopoverContent>
          </Popover>

          {/* Card 3: Completed - Verdigris (Oxidized Copper) */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="group relative overflow-hidden rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-900/20 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-emerald-200/60 text-xs font-bold uppercase tracking-wider mb-1">Tamamlanan Görüşme</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-100">{stats.tamamlandi}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-700/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                    style={{ width: `${stats.total > 0 ? (stats.tamamlandi / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-emerald-200 shadow-2xl" align="start">
              {(() => {
                const list = randevular.filter(r => getStatusConfig(r.durum).id === APPOINTMENT_STATUS.COMPLETED.id);
                return (
                  <div className="bg-white rounded-md overflow-hidden">
                    <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-100 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase">Tamamlanan</h4>
                      <span className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">{list.length}</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1 space-y-1">
                      {list.length > 0 ? list.map(r => (
                        <div key={r.id} className="p-2 hover:bg-emerald-50/50 rounded border border-transparent hover:border-emerald-100 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm text-slate-800 line-clamp-1">{r.ad_soyad}</span>
                            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{r.cikis_saati || "-"}</span>
                          </div>
                          {r.sonuc_notlari && <div className="text-[10px] text-emerald-600/80 mt-1 line-clamp-1">Not: {r.sonuc_notlari}</div>}
                        </div>
                      )) : <div className="p-4 text-center text-xs text-slate-400">Kayıt yok</div>}
                    </div>
                  </div>
                )
              })()}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Canlı Durum Paneli - Bekleme Salonu ve Görüşme Odası */}
      {randevular.some(r => r.durum === "Kapıda Bekliyor" || r.durum === "Görüşmede") && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Bekleme Salonu Uyarı Kartı */}
          {randevular.filter(r => r.durum === "Kapıda Bekliyor").length > 0 && (
            <div className="relative overflow-hidden bg-orange-50 rounded-2xl border border-orange-200 p-5 shadow-sm ring-4 ring-orange-500/10">
              <div className="absolute top-0 right-0 p-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200">
                  <DoorOpen className="w-6 h-6 text-orange-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-900">Misafir Beklemede</h3>
                  <p className="text-orange-700 text-sm">
                    {randevular.filter(r => r.durum === "Kapıda Bekliyor").length} kişi bekleme salonunda.
                  </p>
                </div>
              </div>
              {/* Bekleyen Kişilerin Listesi (Özet) */}
              <div className="mt-4 space-y-2">
                {randevular.filter(r => r.durum === "Kapıda Bekliyor").map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-white/60 p-2.5 rounded-lg border border-orange-200/50 backdrop-blur-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-orange-900">{r.ad_soyad}</span>
                      <span className="text-xs text-orange-600/80">{r.kurum}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">{r.giris_saati || r.saat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Görüşme Odası Kartı */}
          {randevular.filter(r => r.durum === "Görüşmede").length > 0 && (
            <div className="relative overflow-hidden bg-cyan-50 rounded-2xl border border-cyan-200 p-5 shadow-sm ring-4 ring-cyan-500/10">
              <div className="absolute top-0 right-0 p-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center border border-cyan-200">
                  <Play className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-cyan-900">Görüşme Devam Ediyor</h3>
                  <p className="text-cyan-700 text-sm">
                    Makamda aktif görüşme var.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {randevular.filter(r => r.durum === "Görüşmede").map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-white/60 p-2.5 rounded-lg border border-cyan-200/50 backdrop-blur-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-cyan-900">{r.ad_soyad}</span>
                      <span className="text-xs text-cyan-600/80">{r.kurum}</span>
                    </div>
                    {r.gorusme_baslangic && (
                      <span className="text-xs font-mono font-medium text-cyan-700 bg-cyan-100 px-2 py-1 rounded">{r.gorusme_baslangic}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT AREA: LIST vs CALENDAR */}
      {viewMode === "takvim" ? (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <RandevuCalendarView
            appointments={randevular.filter(r => [
              APPOINTMENT_STATUS.APPROVED.id,
              APPOINTMENT_STATUS.WAITING_ROOM.id,
              APPOINTMENT_STATUS.IN_MEETING.id,
              APPOINTMENT_STATUS.COMPLETED.id
            ].includes(r.durum as any))}
            viewMode={calendarViewMode}
            onViewModeChange={setCalendarViewMode}
            date={new Date(filterTarih)}
            onDateChange={(date) => {
              setFilterTarih(dayjs(date).format("YYYY-MM-DD"));
              setDateRange("today");
            }}
            onAddClick={handleAdd}
            onEditClick={handleEdit}
            onDeleteClick={openDeleteDialog}
          />
        </div>
      ) : (
        <>
          {/* Actions Bar (Search/Filter/Add) - Only for list view for now */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-6">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Date Range Buttons with Icons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => handleDateRangeChange("today")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    dateRange === "today"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <CalendarDays className="w-4 h-4" />
                  Bugün
                </button>
                <button
                  onClick={() => handleDateRangeChange("week")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    dateRange === "week"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <CalendarRange className="w-4 h-4" />
                  Hafta
                </button>
                <button
                  onClick={() => handleDateRangeChange("all")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    dateRange === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <List className="w-4 h-4" />
                  Tümü
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="İsim, kurum veya konu ara..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all"
                />
              </div>

              <select
                value={filterDurum}
                onChange={(e) => { setFilterDurum(e.target.value); setCurrentPage(1); }}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all cursor-pointer"
              >
                <option value="">Tüm Durumlar</option>
                {Object.values(APPOINTMENT_STATUS).map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Button */}
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                className="group flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium hover:shadow-sm"
                title="Excel'e Aktar"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-600 group-hover:text-green-700" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                onClick={() => window.print()}
                className="group flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium hover:shadow-sm"
                title="Listeyi Yazdır"
              >
                <Printer className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
                <span className="hidden sm:inline">Yazdır</span>
              </button>

              <button
                onClick={handleAdd}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-500/25 font-medium"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Yeni Randevu
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6 h-[calc(100vh-26rem)] min-h-[500px] flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Saat</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ad Soyad</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurum</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Konu</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="text-right px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : randevular.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-1">Randevu Bulunamadı</h3>
                          <p className="text-slate-500 mb-4">Bu tarihte kayıtlı randevu yok</p>
                          <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Randevu Ekle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    randevular.map((randevu) => {
                      const config = getDurumConfig(randevu.durum);
                      const isExpanded = expandedId === randevu.id;

                      return (
                        <Fragment key={randevu.id}>
                          <tr
                            className={`group hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                            onClick={() => toggleExpand(randevu.id)}
                          >
                            {/* Date */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                {randevu.tarih ? format(new Date(randevu.tarih), "d MMMM yyyy", { locale: tr }) : "-"}
                              </div>
                            </td>

                            {/* Time */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                                <span className="text-slate-600 text-sm font-medium">
                                  {randevu.saat || "--:--"}
                                </span>
                              </div>
                            </td>

                            {/* Name */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {getStatusConfig(randevu.durum).id === APPOINTMENT_STATUS.WAITING_ROOM.id && (
                                  <div className="relative flex h-3 w-3 mr-0.5" title="Bekleme Alanında">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                  </div>
                                )}
                                <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                                  {randevu.ad_soyad ? randevu.ad_soyad.split(' ').map(n => n.charAt(0).toLocaleUpperCase('tr-TR')).slice(0, 2).join('') : "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{randevu.ad_soyad || "İsimsiz"}</p>
                                  {randevu.unvan && (
                                    <p className="text-xs text-slate-500">{randevu.unvan}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Organization */}
                            <td className="px-4 py-4">
                              <span className="text-slate-600">{randevu.kurum || "-"}</span>
                            </td>

                            {/* Subject */}
                            <td className="px-4 py-4">
                              <span className="text-slate-600 line-clamp-1 max-w-xs">{randevu.amac || "-"}</span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button onClick={(e) => e.stopPropagation()} className={cn(
                                    "group inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow active:scale-95 border border-transparent/10",
                                    config.bg, config.text
                                  )}>
                                    <config.icon className="w-3.5 h-3.5 opacity-75 group-hover:opacity-100 transition-opacity" />
                                    <span>{config.label}</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[600px] p-0" align="end" sideOffset={5} onClick={(e) => e.stopPropagation()}>
                                  <div className="columns-2 gap-4 p-4 bg-slate-50/50 block">
                                    {[
                                      {
                                        title: "Onay ve Planlama",
                                        statuses: [
                                          APPOINTMENT_STATUS.APPROVED
                                        ]
                                      },
                                      {
                                        title: "Talep ve Karar",
                                        statuses: [
                                          APPOINTMENT_STATUS.PENDING_APPROVAL,
                                          APPOINTMENT_STATUS.ON_HOLD,
                                          APPOINTMENT_STATUS.DELEGATED_SUB,
                                          APPOINTMENT_STATUS.REJECTED
                                        ]
                                      },
                                      {
                                        title: "Değişiklik ve İptal",
                                        statuses: [
                                          APPOINTMENT_STATUS.RESCHEDULED_HOST,
                                          APPOINTMENT_STATUS.RESCHEDULE_REQ_VISITOR,
                                          APPOINTMENT_STATUS.NO_SHOW
                                        ]
                                      },
                                      {
                                        title: "Operasyon (Randevu Günü)",
                                        statuses: [
                                          APPOINTMENT_STATUS.WAITING_ROOM,
                                          APPOINTMENT_STATUS.IN_MEETING,
                                          APPOINTMENT_STATUS.COMPLETED
                                        ]
                                      }
                                    ].map((group, groupIdx) => (
                                      <div key={groupIdx} className="break-inside-avoid mb-4 bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                                        <h4 className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100">
                                          {group.title}
                                        </h4>
                                        <div className="p-1.5 space-y-1">
                                          {group.statuses.map((status) => {
                                            const statusConfig = getDurumConfig(status.id);
                                            const currentId = getStatusConfig(randevu.durum).id;
                                            const isSelected = currentId === status.id;
                                            const Icon = statusConfig.icon;

                                            return (
                                              <button
                                                key={status.id}
                                                onClick={() => handleStatusUpdate(randevu.id, status.id, randevu)}
                                                className={cn(
                                                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all relative overflow-hidden group border border-transparent hover:border-slate-200 hover:bg-slate-50",
                                                  isSelected && "bg-white shadow-md border-slate-100 ring-1 ring-black/5 z-10"
                                                )}
                                              >
                                                {/* Active Indicator & Hover Highlight */}
                                                {isSelected && <div className={cn("absolute left-0 top-2 bottom-2 w-1 rounded-r-full", statusConfig.text.replace('text-', 'bg-').split(' ')[0])} />}

                                                {/* Icon Box */}
                                                <div className={cn(
                                                  "flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-lg transition-transform group-hover:scale-105 shadow-sm",
                                                  statusConfig.bg,
                                                  statusConfig.text
                                                )}>
                                                  <Icon className="w-5 h-5" />
                                                </div>

                                                {/* Text Info */}
                                                <div className="flex-1 text-left min-w-0">
                                                  <div className="flex items-center justify-between">
                                                    <p className={cn("font-semibold text-sm truncate", isSelected ? "text-slate-900" : "text-slate-700")}>
                                                      {status.label}
                                                    </p>
                                                    {isSelected && <CheckCheck className={cn("w-4 h-4 ml-2", statusConfig.text)} />}
                                                  </div>
                                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal leading-tight opacity-80">
                                                    {status.description}
                                                  </p>
                                                </div>
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {/* Fiziksel Giriş Aksiyonları - Duruma göre göster */}
                                {/* Geldi butonu - Sadece Onaylandı durumunda ve henüz gelmemişse */}


                                {/* Kapıda Bekliyor - Görüşmeye Al butonu */}
                                {getStatusConfig(randevu.durum).id === APPOINTMENT_STATUS.WAITING_ROOM.id && (
                                  <>
                                    <span className="text-xs text-amber-600 font-medium mr-2 animate-pulse flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                      <History className="w-3 h-3" />
                                      {formatWaitingTime(calculateWaitingTime(randevu.giris_saati))}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(randevu.id, APPOINTMENT_STATUS.IN_MEETING.id, randevu);
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-sm hover:shadow transition-all"
                                      title="Görüşmeye Al"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-white" />
                                      Görüşmeye Al
                                    </button>
                                  </>
                                )}

                                {/* Görüşmede - Bitir butonu */}
                                {randevu.durum === "Görüşmede" && (
                                  <button
                                    onClick={() => handleGorusmeBitti(randevu)}
                                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                                    title="Görüşmeyi Bitir"
                                  >
                                    <Square className="w-3.5 h-3.5" />
                                    Bitir
                                  </button>
                                )}

                                {/* Talimat Oluştur - Görüşüldü durumunda */}
                                {randevu.durum === "Görüşüldü" && (
                                  <button
                                    onClick={() => handleTalimatOlustur(randevu)}
                                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                                    title="Talimat Oluştur"
                                  >
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    Talimat
                                  </button>
                                )}

                                <button
                                  onClick={() => handleEdit(randevu)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Düzenle"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteDialog(randevu.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleExpand(randevu.id)}
                                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Detay"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr key={`${randevu.id}-details`}>
                              <td colSpan={7} className="px-4 py-4 bg-slate-50 border-b border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                                  {/* Talep Kaynağı Badge */}
                                  {randevu.talep_kaynagi && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${randevu.talep_kaynagi === "Telefon" ? "bg-blue-100 text-blue-700" :
                                        randevu.talep_kaynagi === "Web" ? "bg-green-100 text-green-700" :
                                          randevu.talep_kaynagi === "Dilekçe" ? "bg-amber-100 text-amber-700" :
                                            randevu.talep_kaynagi === "Sözlü" ? "bg-purple-100 text-purple-700" :
                                              randevu.talep_kaynagi === "Protokol" ? "bg-rose-100 text-rose-700" :
                                                "bg-slate-100 text-slate-700"
                                        }`}>
                                        {randevu.talep_kaynagi === "Telefon" && "📞"}
                                        {randevu.talep_kaynagi === "Web" && "🌐"}
                                        {randevu.talep_kaynagi === "Dilekçe" && "📝"}
                                        {randevu.talep_kaynagi === "Sözlü" && "🗣️"}
                                        {randevu.talep_kaynagi === "Protokol" && "🤝"}
                                        {randevu.talep_kaynagi}
                                      </span>
                                    </div>
                                  )}
                                  {randevu.iletisim && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-slate-400" />
                                      <span className="text-slate-600">{randevu.iletisim}</span>
                                    </div>
                                  )}
                                  {randevu.amac && (
                                    <div className="flex items-start gap-2 text-sm md:col-span-2">
                                      <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                                      <span className="text-slate-600">{randevu.amac}</span>
                                    </div>
                                  )}
                                  {randevu.notlar && (
                                    <div className="flex items-start gap-2 text-sm md:col-span-3">
                                      <Eye className="w-4 h-4 text-slate-400 mt-0.5" />
                                      <span className="text-slate-500 italic">{randevu.notlar}</span>
                                    </div>
                                  )}
                                  {/* Makam Sonuç Notları */}
                                  {randevu.sonuc_notlari && (
                                    <div className="flex items-start gap-2 text-sm md:col-span-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                      <FileEdit className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-emerald-700 mb-1">Makam Notu</p>
                                        <span className="text-emerald-800">{randevu.sonuc_notlari}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* İş Akışı Bilgileri */}
                                  {/* Birim Yönlendirme */}
                                  {randevu.durum === "Birim Yönlendirme" && randevu.yonlendirilen_birim && (
                                    <div className="md:col-span-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                                      <p className="text-xs font-semibold text-teal-700 mb-1 flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5" /> Yönlendirme Bilgisi
                                      </p>
                                      <p className="text-sm text-teal-800 font-medium">{randevu.yonlendirilen_birim}</p>
                                      {randevu.yonlendirme_nedeni && (
                                        <p className="text-xs text-teal-600 mt-1">{randevu.yonlendirme_nedeni}</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Havale Bilgisi */}
                                  {randevu.durum === "Havale Edildi" && randevu.havale_edilen && (
                                    <div className="md:col-span-3 p-3 bg-sky-50 rounded-lg border border-sky-200">
                                      <p className="text-xs font-semibold text-sky-700 mb-1 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> Havale Bilgisi
                                      </p>
                                      <p className="text-sm text-sky-800 font-medium">{randevu.havale_edilen}</p>
                                      {randevu.havale_nedeni && (
                                        <p className="text-xs text-sky-600 mt-1">{randevu.havale_nedeni}</p>
                                      )}
                                    </div>
                                  )}

                                  {/* İptal Gerekçesi - Makam veya Vatandaş İptali */}
                                  {(randevu.durum === APPOINTMENT_STATUS.REJECTED.id || randevu.durum === APPOINTMENT_STATUS.NO_SHOW.id || randevu.durum === "Makam İptal Etti" || randevu.durum === "Vatandaş İptal") && randevu.iptal_gerekcesi && (
                                    <div className="md:col-span-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                      <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                                        <AlertOctagon className="w-3.5 h-3.5" /> İptal Nedeni ({["Vatandaş İptal", APPOINTMENT_STATUS.NO_SHOW.id].includes(randevu.durum || "") ? "Vatandaş" : "Makam"})
                                      </p>
                                      <p className="text-sm text-red-800">{randevu.iptal_gerekcesi}</p>
                                    </div>
                                  )}

                                  {/* Ret Gerekçesi */}
                                  {randevu.durum === "Reddedildi" && randevu.ret_gerekcesi && (
                                    <div className="md:col-span-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
                                      <p className="text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                                        <XCircle className="w-3.5 h-3.5" /> Ret Gerekçesi
                                      </p>
                                      <p className="text-sm text-rose-800">{randevu.ret_gerekcesi}</p>
                                    </div>
                                  )}

                                  {/* Süre Bilgileri */}
                                  {(randevu.giris_saati || randevu.gorusme_baslangic || randevu.cikis_saati) && (
                                    <div className="md:col-span-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                      <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> Süre Takibi
                                      </p>
                                      <div className="grid grid-cols-3 gap-4 text-sm">
                                        {randevu.giris_saati && (
                                          <div>
                                            <p className="text-xs text-blue-500">Kapıdan Giriş</p>
                                            <p className="font-mono font-semibold text-blue-800">{randevu.giris_saati}</p>
                                          </div>
                                        )}
                                        {randevu.gorusme_baslangic && (
                                          <div>
                                            <p className="text-xs text-blue-500">Makama Giriş</p>
                                            <p className="font-mono font-semibold text-blue-800">{randevu.gorusme_baslangic}</p>
                                          </div>
                                        )}
                                        {randevu.cikis_saati && (
                                          <div>
                                            <p className="text-xs text-blue-500">Makamdan Çıkış</p>
                                            <p className="font-mono font-semibold text-blue-800">{randevu.cikis_saati}</p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Hesaplanan Süreler */}
                                      {randevu.giris_saati && randevu.cikis_saati && (
                                        <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-4 text-xs">
                                          {randevu.gorusme_baslangic && (
                                            <span className="text-amber-600 font-medium">
                                              ⏱ Bekleme: {formatWaitingTime(
                                                (() => {
                                                  const [gh, gm] = randevu.giris_saati!.split(":").map(Number);
                                                  const [bh, bm] = randevu.gorusme_baslangic!.split(":").map(Number);
                                                  return (bh * 60 + bm) - (gh * 60 + gm);
                                                })()
                                              )}
                                            </span>
                                          )}
                                          {randevu.gorusme_baslangic && (
                                            <span className="text-cyan-600 font-medium">
                                              💬 Görüşme: {formatWaitingTime(
                                                (() => {
                                                  const [bh, bm] = randevu.gorusme_baslangic!.split(":").map(Number);
                                                  const [ch, cm] = randevu.cikis_saati!.split(":").map(Number);
                                                  return (ch * 60 + cm) - (bh * 60 + bm);
                                                })()
                                              )}
                                            </span>
                                          )}
                                          <span className="text-blue-600 font-medium">
                                            📊 Toplam: {formatWaitingTime(
                                              (() => {
                                                const [gh, gm] = randevu.giris_saati!.split(":").map(Number);
                                                const [ch, cm] = randevu.cikis_saati!.split(":").map(Number);
                                                return (ch * 60 + cm) - (gh * 60 + gm);
                                              })()
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* İlgili Talimatlar */}
                                  {randevu.talimatlar && randevu.talimatlar.length > 0 && (
                                    <div className="md:col-span-3 mt-2 pt-3 border-t border-slate-200">
                                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                        <ClipboardList className="w-4 h-4" /> İlgili Talimatlar ({randevu.talimatlar.length})
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {randevu.talimatlar.map((talimat: any) => (
                                          <div key={talimat.id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm flex flex-col gap-1 shadow-sm">
                                            <div className="flex items-start justify-between">
                                              <p className="font-medium text-slate-800 line-clamp-1" title={talimat.konu}>{talimat.konu}</p>
                                              <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                talimat.onem_derecesi === "Acil" ? "bg-red-100 text-red-700" :
                                                  talimat.onem_derecesi === "Yüksek" ? "bg-orange-100 text-orange-700" :
                                                    "bg-blue-50 text-blue-700"
                                              )}>
                                                {talimat.onem_derecesi}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {talimat.kurum}</span>
                                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                              <span className={cn(
                                                "font-medium",
                                                talimat.durum === "Tamamlandı" ? "text-emerald-600" : "text-amber-600"
                                              )}>{talimat.durum || "Beklemede"}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">
                  Toplam <span className="font-semibold text-slate-700">{totalItems}</span> kayıt,
                  Sayfa <span className="font-semibold text-slate-700">{currentPage}</span> / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    İlk
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                            ? 'bg-slate-800 text-white shadow-md'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Son
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )
      }


      {/* Modal */}
      {
        modalOpen && (
          <RandevuModal
            open={modalOpen}
            onClose={handleModalClose}
            onSuccess={handleSuccess}
            randevu={selectedRandevu}
          />
        )
      }
      {/* Postpone Modal */}
      <Modal
        open={postponeModalOpen}
        onClose={() => setPostponeModalOpen(false)}
        title="Randevu Ertele"
        size="md"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Erteleme Nedeni</label>
            <Input
              value={postponeReason}
              onChange={(e) => setPostponeReason(e.target.value)}
              placeholder="Örn: Toplantı uzadı"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Yeni Tarih</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white h-11",
                    !postponeDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {postponeDate ? (
                    format(postponeDate, "d MMMM yyyy, EEEE", { locale: tr })
                  ) : (
                    <span>Tarih seçin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={postponeDate}
                  onSelect={setPostponeDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Yeni Saat</label>
            <Input
              type="time"
              value={postponeTime}
              onChange={(e) => setPostponeTime(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setPostponeModalOpen(false)}>Vazgeç</Button>
            <Button onClick={handlePostponeSubmit} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
              Ertele ve Yeni Oluştur
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Randevu İptali"
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">
              Randevu iptal edildikten sonra bu işlem geri alınamaz.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">İptal Nedeni <span className="text-red-500">*</span></label>
            <textarea
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
              rows={3}
              placeholder="Makamın iptal nedenini açıklayın..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>Vazgeç</Button>
            <Button
              onClick={handleCancelSubmit}
              disabled={loading || !cancelReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              İptal Et
            </Button>
          </div>
        </div>
      </Modal>

      {/* Görüşme Sonuç Notu Modal */}
      <Modal
        open={sonucNotuModalOpen}
        onClose={() => {
          setSonucNotuModalOpen(false);
          setSonucNotuTarget(null);
          setSonucNotu("");
        }}
        title="Görüşme Tamamlandı"
        size="md"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">{sonucNotuTarget?.ad_soyad}</p>
              <p className="text-sm text-emerald-700">Görüşme tamamlanıyor</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-slate-500" />
              <label className="text-sm font-semibold text-slate-700">
                Makam Notu / Görüşme Sonucu
              </label>
            </div>
            <p className="text-xs text-slate-500 -mt-1">
              Görüşme hakkında özel kalem notlarınızı buraya ekleyebilirsiniz. (İsteğe bağlı)
            </p>
            <textarea
              className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all resize-none bg-white"
              rows={4}
              placeholder="Örn: Talepleri not alındı, İl Müdürlüğü'ne iletilecek..."
              value={sonucNotu}
              onChange={(e) => setSonucNotu(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => {
                setSonucNotu("");
                handleSonucNotuSubmit();
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              Kaydetmeden Bitir
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setSonucNotuModalOpen(false);
                  setSonucNotuTarget(null);
                  setSonucNotu("");
                }}
              >
                Vazgeç
              </Button>
              <Button
                onClick={handleSonucNotuSubmit}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Görüşmeyi Tamamla
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Talimat Oluşturma Modal */}
      <Modal
        open={talimatModalOpen}
        onClose={() => {
          setTalimatModalOpen(false);
          setTalimatTarget(null);
        }}
        title="Talimat Oluştur"
        size="lg"
      >
        <div className="space-y-4 p-4">
          {/* Randevu Bilgisi */}
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-indigo-900">{talimatTarget?.ad_soyad}</p>
              <p className="text-sm text-indigo-700">{talimatTarget?.kurum}</p>
            </div>
            <div className="text-right text-sm text-indigo-600">
              <p>{talimatTarget?.tarih}</p>
              <p>{talimatTarget?.saat}</p>
            </div>
          </div>

          {/* Talimat Formu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Talimat Konusu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                placeholder="Örn: Yol onarım talebi incelenmeli"
                value={talimatForm.konu}
                onChange={(e) => setTalimatForm({ ...talimatForm, konu: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                İlgili Birim / Kurum <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                placeholder="Örn: Fen İşleri Müdürlüğü"
                value={talimatForm.kurum}
                onChange={(e) => setTalimatForm({ ...talimatForm, kurum: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Önem Derecesi
              </label>
              <select
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-white"
                value={talimatForm.onem_derecesi}
                onChange={(e) => setTalimatForm({ ...talimatForm, onem_derecesi: e.target.value })}
              >
                <option value="Normal">Normal</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Acil">Acil</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Termin Tarihi
              </label>
              <input
                type="date"
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                value={talimatForm.tarih}
                onChange={(e) => setTalimatForm({ ...talimatForm, tarih: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Talimatı Veren
              </label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                value={talimatForm.verilen_kisi}
                onChange={(e) => setTalimatForm({ ...talimatForm, verilen_kisi: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Talimat İçeriği / Detaylar
              </label>
              <textarea
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                rows={4}
                placeholder="Talimat detaylarını yazın..."
                value={talimatForm.icerik}
                onChange={(e) => setTalimatForm({ ...talimatForm, icerik: e.target.value })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => {
                setTalimatModalOpen(false);
                setTalimatTarget(null);
              }}
            >
              Vazgeç
            </Button>
            <Button
              onClick={handleTalimatSubmit}
              disabled={loading || !talimatForm.konu.trim() || !talimatForm.kurum.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Talimat Oluştur
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delegation Modal */}
      <Modal
        open={delegateModalOpen}
        onClose={() => setDelegateModalOpen(false)}
        title="Randevu Yönlendirme"
      >
        <p className="text-sm text-slate-500 mb-4">
          Seçilen birim/kişiye talimat oluşturulacak ve randevu yönlendirilecektir.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Yönlendirilecek Kişi/Birim <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border border-slate-200 rounded-lg"
              value={delegateForm.person}
              onChange={(e) => setDelegateForm({ ...delegateForm, person: e.target.value })}
            >
              <option value="">Seçiniz</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.kurum_adi} - {m.ad_soyad}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Talimat Notu / Açıklama
            </label>
            <textarea
              className="w-full p-2 border border-slate-200 rounded-lg"
              rows={3}
              placeholder="Talimat detaylarını giriniz..."
              value={delegateForm.note}
              onChange={(e) => setDelegateForm({ ...delegateForm, note: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDelegateModalOpen(false)}>Vazgeç</Button>
            <Button onClick={handleDelegateSubmit} disabled={loading}>Yönlendir ve Oluştur</Button>
          </div>
        </div>
      </Modal>

      {/* Visitor Reschedule Modal */}
      <Modal
        open={rescheduleVisitorModalOpen}
        onClose={() => setRescheduleVisitorModalOpen(false)}
        title="Ziyaretçi Erteleme Talebi"
      >
        <p className="text-sm text-slate-500 mb-4">
          Ziyaretçinin erteleme talebi gerekçesiyle birlikte kaydedilecektir.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Erteleme Nedeni <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full p-2 border border-slate-200 rounded-lg"
              rows={3}
              placeholder="Neden ertelenmek isteniyor?"
              value={rescheduleVisitorForm.reason}
              onChange={(e) => setRescheduleVisitorForm({ ...rescheduleVisitorForm, reason: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setRescheduleVisitorModalOpen(false)}>Vazgeç</Button>
            <Button onClick={handleRescheduleVisitorSubmit} disabled={loading}>Talebi Kaydet</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Randevuyu Sil"
        message="Bu randevuyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div >
  );
}
