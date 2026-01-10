"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Trash2, UserPlus, X, Phone, Building2, User, Clock, Calendar as CalendarIcon, FileText, Users, UserCheck, Zap, ArrowRight, AlertCircle, ShieldAlert, Gift, Repeat, Car, CalendarCheck } from "lucide-react";
import { useToastStore } from "@/hooks/useToastStore";
import { format } from "date-fns";
import dayjs from "dayjs";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS, getStatusConfig } from "@/lib/constants";
import { TimePicker } from "@/components/ui/TimePicker";



const randevuSchema = z.object({
  ad_soyad: z.string().min(1, "Ad soyad gerekli"),
  kurum: z.string().min(1, "Kurum gerekli"),
  unvan: z.string().optional(),
  telefon: z.string().optional(),
  konu: z.string().optional(),
  tarih: z.date(),
  saat: z.string().min(1, "Saat gerekli"),
  notlar: z.string().optional(),
  konuklar: z.array(z.object({ ad: z.string() })).optional(),
  durum: z.string().optional(),
  talep_kaynagi: z.string().optional(), // Telefon, Web, Dilekçe, Sözlü, Protokol
  erteleme_tarihi: z.date().optional(),
  erteleme_saati: z.string().optional(),
  erteleme_nedeni: z.string().optional(),
  hediye_notu: z.string().optional(),
  arac_plaka: z.string().optional(),
});

type RandevuFormData = z.infer<typeof randevuSchema>;

interface RandevuModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  randevu?: any;
  initialDate?: Date;
  initialTime?: string;
  existingAppointments?: any[];
}

export default function RandevuModal({
  open,
  onClose,
  onSuccess,
  randevu,
  initialDate,
  initialTime,
  existingAppointments
}: RandevuModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Walk-in (Ziyaretçi) states
  const [walkIns, setWalkIns] = useState<any[]>([]);
  const [showWalkInsDialog, setShowWalkInsDialog] = useState(false);
  const [loadingWalkIns, setLoadingWalkIns] = useState(false);

  // Security & History Check States
  const [securityResult, setSecurityResult] = useState<{ seviye: string; mesaj: string } | null>(null);
  const [historyResult, setHistoryResult] = useState<any[]>([]);

  const checkVisitor = async (name: string) => {
    if (!name || name.length < 3) {
      setSecurityResult(null);
      setHistoryResult([]);
      return;
    }

    // Check Security
    try {
      const res = await fetch(`/api/guvenlik/check?ad_soyad=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.risk) setSecurityResult(data.risk);
      else setSecurityResult(null);
    } catch (error) {
      console.error("Security check failed:", error);
    }

    // Check History (Gifts)
    try {
      const res = await fetch(`/api/randevu/check-history?ad_soyad=${encodeURIComponent(name)}`);
      const data = await res.json();
      setHistoryResult(data.history || []);
    } catch (error) {
      console.error("History check failed:", error);
    }
  };

  // Recurring States
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatType, setRepeatType] = useState("weekly");
  const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>(undefined);

  // Immediate entry state
  const [isImmediate, setIsImmediate] = useState(false);

  const { showToast } = useToastStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<RandevuFormData>({
    defaultValues: {
      ad_soyad: "",
      kurum: "",
      unvan: "",
      telefon: "",
      konu: "",
      tarih: new Date(),
      saat: "",
      notlar: "",
      konuklar: [],
      talep_kaynagi: "Telefon" // Default kaynak
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "konuklar",
  });


  const selectedDate = watch("tarih");

  // Conflict Warning State & Logic
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const formDateForConflict = watch("tarih");
  const formTimeForConflict = watch("saat");

  useEffect(() => {
    if (!open || !existingAppointments || !formDateForConflict || !formTimeForConflict) {
      setConflictWarning(null);
      return;
    }

    const dateStr = format(formDateForConflict, "yyyy-MM-dd");

    const conflict = existingAppointments.find(app => {
      if (randevu && app.id === randevu.id) return false;

      const statusId = getStatusConfig(app.durum).id;
      if (statusId === APPOINTMENT_STATUS.REJECTED.id ||
        statusId === APPOINTMENT_STATUS.NO_SHOW.id ||
        statusId === APPOINTMENT_STATUS.COMPLETED.id) return false;

      return app.tarih === dateStr && app.saat === formTimeForConflict;
    });

    if (conflict) {
      setConflictWarning(`Dikkat: Bu saatte "${conflict.ad_soyad}" (${conflict.kurum}) ile randevu mevcut.`);
    } else {
      setConflictWarning(null);
    }
  }, [formDateForConflict, formTimeForConflict, existingAppointments, open, randevu]);

  // Fetch walk-ins when modal opens or date changes
  useEffect(() => {
    if (open && !randevu && selectedDate) {
      fetchWalkIns();
    }
  }, [open, randevu, selectedDate]);

  const fetchWalkIns = async () => {
    try {
      setLoadingWalkIns(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/ziyaret?tarih=${dateStr}&limit=100`);

      if (response.ok) {
        const result = await response.json();
        // Filter for visitors who haven't exited yet (cikis_saati is null or empty)
        // and match the selected date (though API filters by date, good to be safe)
        const activeVisitors = result.data.filter((v: any) => !v.cikis_saati);
        setWalkIns(activeVisitors);
      }
    } catch (error) {
      console.error("Error fetching walk-ins:", error);
    } finally {
      setLoadingWalkIns(false);
    }
  };

  const handleSelectWalkIn = (visitor: any) => {
    setValue("ad_soyad", visitor.ad_soyad);
    setValue("kurum", visitor.kurum || "");
    setValue("unvan", visitor.unvan || "");

    // Format phone if exists
    if (visitor.iletisim) {
      // Simple cleanup for display
      setValue("telefon", visitor.iletisim.replace(/^0/, '').replace(/\D/g, ''));
    }

    // Add extra info to notes
    const extraInfo = `Ziyaret Kaydı ID: ${visitor.id}\nGiriş: ${visitor.giris_saati}`;
    setValue("notlar", extraInfo);

    setShowWalkInsDialog(false);
    showToast("Ziyaretçi bilgileri aktarıldı", "success");
  };

  useEffect(() => {
    setSecurityResult(null); // Reset security warning
    setHistoryResult([]); // Reset history
    setIsRecurring(false);
    setRepeatType("weekly");
    setRepeatEndDate(undefined);

    if (randevu) {
      checkVisitor(randevu.ad_soyad || ""); // Check existing appointment person
      reset({
        ad_soyad: randevu.ad_soyad || "",
        kurum: randevu.kurum || "",
        unvan: randevu.unvan || "",
        telefon: randevu.iletisim || "",
        konu: randevu.amac || "",
        tarih: randevu.tarih ? new Date(randevu.tarih) : undefined,
        saat: randevu.saat || "",
        notlar: randevu.notlar || "",
        konuklar: [],
        durum: getStatusConfig(randevu.durum).id,
        talep_kaynagi: randevu.talep_kaynagi || "Telefon"
      });
    } else {
      reset({
        ad_soyad: "",
        kurum: "",
        unvan: "",
        telefon: "",
        konu: "",
        tarih: initialDate || new Date(),
        saat: initialTime || "",
        notlar: "",
        konuklar: [],
        talep_kaynagi: "Telefon",
        durum: "PENDING_APPROVAL"
      });
    }
  }, [randevu, reset, initialDate, initialTime]);

  // Phone masking handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

    // Ensure it starts with 5 (since 0 is fixed outside)
    if (value.length > 0 && value[0] === '0') value = value.substring(1);

    // Limit to 10 digits
    if (value.length > 10) value = value.substring(0, 10);

    // Format: 5XX-XXX-XX-XX
    let formatted = value;
    if (value.length > 3) formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
    if (value.length > 6) formatted = `${formatted.slice(0, 7)}-${value.slice(6)}`;
    if (value.length > 8) formatted = `${formatted.slice(0, 10)}-${value.slice(8)}`;

    setValue("telefon", formatted);
  };

  const downloadICS = () => {
    if (!randevu) return;

    const dateStr = randevu.tarih;
    const dateTimeStr = `${dayjs(dateStr).format('YYYY-MM-DD')} ${randevu.saat}`;
    const start = dayjs(dateTimeStr);
    const end = start.add(30, 'minute');

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Valilik//Randevu Sistemi//TR',
      'BEGIN:VEVENT',
      `UID:${randevu.id}@valilik.gov.tr`,
      `DTSTAMP:${dayjs().format('YYYYMMDDTHHmm00')}`,
      `DTSTART:${start.format('YYYYMMDDTHHmm00')}`,
      `DTEND:${end.format('YYYYMMDDTHHmm00')}`,
      `SUMMARY:Randevu: ${randevu.ad_soyad}`,
      `DESCRIPTION:${randevu.notlar || ""}`,
      `LOCATION:${randevu.kurum || "Valilik"}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `randevu-${randevu.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = async (data: RandevuFormData) => {
    try {
      setLoading(true);

      const url = randevu ? `/api/randevu/${randevu.id}` : "/api/randevu";
      const method = randevu ? "PUT" : "POST";

      // Process guests
      let finalNotes = data.notlar || "";
      let participantCount = 1;

      if (data.konuklar && data.konuklar.length > 0) {
        participantCount += data.konuklar.length;
        const guestNames = data.konuklar.map(k => k.ad).filter(n => n.trim() !== "").join(", ");
        if (guestNames) {
          finalNotes = finalNotes ? `${finalNotes}\n\nDiğer Katılımcılar: ${guestNames}` : `Diğer Katılımcılar: ${guestNames}`;
        }
      }

      // Format phone with leading 0
      const formattedPhone = data.telefon ? `0${data.telefon.replace(/-/g, '')}` : "";

      // Format date for API (YYYY-MM-DD)
      const formattedDate = format(data.tarih, "yyyy-MM-dd");

      const payload = {
        ad_soyad: data.ad_soyad,
        kurum: data.kurum,
        unvan: data.unvan,
        iletisim: formattedPhone,
        amac: data.konu,
        tarih: formattedDate,
        saat: data.saat,
        durum: isImmediate ? "Onaylandı" : (randevu?.durum || "Bekliyor"),
        notlar: finalNotes,
        katilimci: participantCount,
        tipi: "Randevu",
        talep_kaynagi: data.talep_kaynagi || "Telefon",
        hediye_notu: data.hediye_notu,
        arac_plaka: data.arac_plaka,
        repeat: (!randevu && isRecurring && repeatEndDate) ? {
          type: repeatType,
          endDate: format(repeatEndDate, "yyyy-MM-dd")
        } : undefined
      };

      // Special handling for Postponement (Ertelendi)
      if (randevu && data.durum === "Ertelendi") {
        if (!data.erteleme_tarihi || !data.erteleme_saati || !data.erteleme_nedeni) {
          showToast("Lütfen erteleme nedeni, yeni tarih ve saati giriniz.", "error");
          setLoading(false);
          return;
        }

        // 1. Update existing appointment to "Ertelendi"
        const postponeNote = `\n\n[ERTELENDİ] Nedeni: ${data.erteleme_nedeni}\nYeni Randevu Tarihi: ${format(data.erteleme_tarihi, "dd.MM.yyyy")} ${data.erteleme_saati}`;

        const updatePayload = {
          ...payload, // Use basic payload but override status and notes
          durum: "Ertelendi",
          notlar: (payload.notlar || "") + postponeNote
        };

        const updateResponse = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!updateResponse.ok) throw new Error("Mevcut randevu güncellenemedi");

        // 2. Create NEW appointment
        const formattedNewDate = format(data.erteleme_tarihi, "yyyy-MM-dd");
        const newPayload = {
          ...payload,
          tarih: formattedNewDate,
          saat: data.erteleme_saati,
          durum: "Onaylandı", // New appointment starts as confirmed
          notlar: `(Ertelenen Randevu)\nÖnceki Tarih: ${format(data.tarih, "dd.MM.yyyy")}\n\n` + (payload.notlar || ""),
        };

        const createResponse = await fetch("/api/randevu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPayload),
        });

        if (!createResponse.ok) throw new Error("Yeni randevu oluşturulamadı");

        showToast("Randevu ertelendi ve yeni kayıt oluşturuldu", "success");
        onSuccess();
        setLoading(false);
        return;
      }

      // Normal UPDATE/CREATE logic (if not Ertelendi or if Create mode)

      // If editing, use the selected status from dropdown
      // If creating, use logic (Immediate vs Default)
      // Note: We already set durum in payload initialization, but let's refine it for Edit mode
      if (randevu && data.durum) {
        payload.durum = data.durum;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "İşlem başarısız");
      }

      showToast(
        randevu ? "Randevu başarıyla güncellendi" : "Randevu başarıyla oluşturuldu",
        "success"
      );
      onSuccess();
    } catch (error: any) {
      showToast(error.message || "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/randevu/${randevu.id}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Silme işlemi başarısız");
      }

      showToast("Randevu başarıyla silindi", "success");
      onSuccess();
    } catch (error: any) {
      showToast(error.message || "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={randevu ? "Randevu Düzenle" : "Yeni Randevu Oluştur"}
        size="lg" // Make modal larger
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">

          {/* Actions Bar */}
          {randevu && (
            <div className="flex justify-end pb-2">
              <Button variant="outline" size="sm" onClick={downloadICS} type="button" className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-50">
                <CalendarCheck className="w-4 h-4" /> Takvime Ekle (.ics)
              </Button>
            </div>
          )}

          {/* Security Warning */}
          {securityResult && (
            <div className={cn(
              "border rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2",
              ["Kritik", "Yüksek"].includes(securityResult.seviye) ? "bg-red-50 border-red-200 text-red-800" :
                securityResult.seviye === "Orta" ? "bg-orange-50 border-orange-200 text-orange-800" :
                  "bg-yellow-50 border-yellow-200 text-yellow-800"
            )}>
              <ShieldAlert className={cn("w-5 h-5 flex-shrink-0 mt-0.5",
                ["Kritik", "Yüksek"].includes(securityResult.seviye) ? "text-red-600 animate-pulse" : "text-orange-600"
              )} />
              <div>
                <h4 className="font-bold text-sm">Güvenlik Uyarısı ({securityResult.seviye} Risk)</h4>
                <p className="text-sm opacity-90">{securityResult.mesaj}</p>
              </div>
            </div>
          )}

          {/* Walk-in Alert / Button */}
          {!randevu && walkIns.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 text-sm">
                <Users className="w-4 h-4" />
                <span>Şu an içeride <strong>{walkIns.length}</strong> randevusuz ziyaretçi var.</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                onClick={() => setShowWalkInsDialog(true)}
              >
                Listeyi Gör
              </Button>
            </div>
          )}

          {/* Immediate Entry Checkbox */}
          {!randevu && (
            <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isImmediate ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              onClick={() => {
                const newState = !isImmediate;
                setIsImmediate(newState);
                if (newState) {
                  setValue("tarih", new Date());
                  setValue("saat", format(new Date(), "HH:mm"));
                }
              }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isImmediate ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Anlık Giriş (Makamda)</div>
                <div className="text-xs text-slate-500">Randevusuz giriş yapan misafirler için kullanın. Otomatik onaylanır.</div>
              </div>
              <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isImmediate ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                {isImmediate && <UserCheck className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}

          {/* Main Info Section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Kişi & Kurum Bilgileri
            </h3>

            {/* Talep Kaynağı - En Üstte */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Talep Kaynağı</label>
              <select
                {...register("talep_kaynagi")}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all"
              >
                <option value="Telefon">📞 Telefon</option>
                <option value="Web">🌐 Web / E-Devlet</option>
                <option value="Dilekçe">📝 Dilekçe / Resmi Yazı</option>
                <option value="Sözlü">🗣️ Sözlü Talep</option>
                <option value="Protokol">🤝 Protokol</option>
              </select>
              <p className="text-xs text-slate-400">Randevu talebinin nereden geldiğini seçin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Talep Eden Ad Soyad <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Örn: Ahmet Yılmaz"
                  {...register("ad_soyad")}
                  onBlurCapture={(e) => checkVisitor((e.target as HTMLInputElement).value)}
                  error={errors.ad_soyad?.message}
                  className="bg-white"
                  autoTitleCase
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kurum <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Örn: Valilik Makamı"
                    {...register("kurum")}
                    error={errors.kurum?.message}
                    className="bg-white pl-10"
                    autoTitleCase
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Ünvan</label>
                <Input
                  placeholder="Örn: İl Müdürü"
                  {...register("unvan")}
                  error={errors.unvan?.message}
                  className="bg-white"
                  autoTitleCase
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Telefon</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 top-2.5 flex items-center gap-2 border-r border-slate-200 pr-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500 font-medium text-sm">0</span>
                  </div>
                  <Input
                    placeholder="5XX-XXX-XX-XX"
                    {...register("telefon")}
                    onChange={handlePhoneChange}
                    error={errors.telefon?.message}
                    className="bg-white pl-16 font-mono"
                    maxLength={13}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700">Araç Plakası (Varsa)</label>
              <div className="relative mt-1.5">
                <Car className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="34 ABC 123"
                  {...register("arac_plaka")}
                  className="bg-white pl-10 uppercase font-mono placeholder:normal-case placeholder:font-sans"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    register("arac_plaka").onChange(e);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Çakışma Uyarısı */}
          {conflictWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800">Çakışma Uyarısı</h4>
                <p className="text-xs text-amber-700 mt-0.5">{conflictWarning}</p>
              </div>
            </div>
          )}

          {/* Status & Postponement Section - Only in Edit Mode */}
          {randevu && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Durum Yönetimi
              </h3>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Randevu Durumu</label>
                <select
                  {...register("durum")}
                  className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                >
                  {Object.values(APPOINTMENT_STATUS).map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Postponement Fields */}
              {watch("durum") === "RESCHEDULED_HOST" && (
                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-purple-800 font-medium pb-2 border-b border-purple-100 mb-2">
                    <ArrowRight className="w-4 h-4" />
                    Randevu Erteleme Detayları
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-purple-900">Erteleme Nedeni <span className="text-red-500">*</span></label>
                    <Input
                      placeholder="Örn: Makamın acil toplantısı çıktı"
                      {...register("erteleme_nedeni")}
                      className="bg-white border-purple-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                  </div>

                  {/* Çakışma Uyarısı */}
                  {conflictWarning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-800">Zaman Çakışması</h4>
                        <p className="text-xs text-amber-700 mt-1">{conflictWarning}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-purple-900">Yeni Tarih <span className="text-red-500">*</span></label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white h-11 border-purple-200 hover:bg-white hover:text-purple-900",
                              !watch("erteleme_tarihi") && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                            {watch("erteleme_tarihi") ? (
                              format(watch("erteleme_tarihi")!, "d MMMM yyyy, EEEE", { locale: tr })
                            ) : (
                              <span>Yeni tarih seçin</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={watch("erteleme_tarihi")}
                            onSelect={(date) => setValue("erteleme_tarihi", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-purple-900">Yeni Saat <span className="text-red-500">*</span></label>
                      <TimePicker
                        value={watch("erteleme_saati") || "09:00"}
                        onChange={(time) => setValue("erteleme_saati", time)}
                        placeholder="Saat seçin"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-purple-600 italic">
                    * Bu işlem mevcut randevuyu "Ertelendi" olarak işaretler ve seçilen tarihe yeni bir randevu oluşturur.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date & Time Section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Zamanlama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tarih <span className="text-red-500">*</span></label>
                {/* Modern Calendar using Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white h-11",
                        !selectedDate && "text-muted-foreground",
                        errors.tarih && "border-red-500 ring-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "d MMMM yyyy, EEEE", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setValue("tarih", date as Date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.tarih && <p className="text-xs text-red-500 mt-1">{errors.tarih.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Saat <span className="text-red-500">*</span></label>
                <TimePicker
                  value={watch("saat") || "09:00"}
                  onChange={(time) => setValue("saat", time)}
                  placeholder="Saat seçin"
                />
                {errors.saat && <p className="text-xs text-red-500 mt-1">{errors.saat.message}</p>}
              </div>
            </div>


            {/* Recurring Option - Only New Appointment */}
            {!randevu && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <div
                  className={cn(
                    "flex items-center gap-2 cursor-pointer transition-colors group",
                    isRecurring ? "text-blue-700" : "text-slate-500 hover:text-slate-700"
                  )}
                  onClick={() => setIsRecurring(!isRecurring)}
                >
                  <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all", isRecurring ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300 group-hover:border-slate-400")}>
                    {isRecurring ? <Repeat className="w-3.5 h-3.5 text-white" /> : null}
                  </div>
                  <span className="text-sm font-medium select-none flex items-center gap-2">
                    Bu randevuyu tekrarla
                    {!isRecurring && <span className="text-xs text-slate-400 font-normal bg-slate-100 px-2 py-0.5 rounded-full">Periyodik</span>}
                  </span>
                </div>

                {isRecurring && (
                  <div className="mt-4 pl-7 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tekrar Sıklığı</label>
                      <select
                        value={repeatType}
                        onChange={(e) => setRepeatType(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="daily">Günlük (Her Gün)</option>
                        <option value="weekly">Haftalık (Her Hafta)</option>
                        <option value="biweekly">2 Haftada Bir</option>
                        <option value="monthly">Aylık (Her Ay)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bitiş Tarihi</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-normal border-slate-200", !repeatEndDate && "text-muted-foreground border-dashed")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                            {repeatEndDate ? format(repeatEndDate, "d MMM yyyy", { locale: tr }) : "Bitiş Tarihi Seçin"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={repeatEndDate}
                            onSelect={setRepeatEndDate}
                            initialFocus
                            disabled={(date) => date < (selectedDate || new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Guests Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600" />
                Diğer Katılımcılar
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ ad: "" })}
                className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 h-8"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Kişi Ekle
              </Button>
            </div>

            {fields.length > 0 && (
              <div className="bg-sky-50 p-4 rounded-xl space-y-3 border border-sky-100">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder={`${index + 1}. Katılımcı Adı Soyadı`}
                      {...register(`konuklar.${index}.ad` as const)}
                      className="bg-white border-sky-200 focus:border-sky-300 focus:ring-sky-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Konu</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Randevu konusu..."
                  {...register("konu")}
                  error={errors.konu?.message}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Notlar</label>
              <Textarea
                placeholder="Varsa ek notlar..."
                {...register("notlar")}
                error={errors.notlar?.message}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
            {randevu ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
                className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Kaydı Sil
              </Button>
            ) : <div></div>}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="text-slate-500 hover:text-slate-700"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 px-8"
              >
                {randevu ? "Güncelle" : "Randevu Oluştur"}
              </Button>
            </div>
          </div>
        </form>
      </Modal >

      {/* Walk-in Select Dialog */}
      < Modal
        open={showWalkInsDialog}
        onClose={() => setShowWalkInsDialog(false)
        }
        title="Randevusuz Bekleyenler"
        size="md"
      >
        <div className="p-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-2 mt-2">
            {walkIns.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Bekleyen ziyaretçi bulunamadı.
              </div>
            ) : (
              walkIns.map((visitor) => (
                <div key={visitor.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg">
                      {visitor.ad_soyad.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{visitor.ad_soyad}</div>
                      <div className="text-xs text-slate-500 flex gap-2">
                        <span>{visitor.kurum || "Kurum yok"}</span>
                        <span>•</span>
                        <span>{visitor.giris_saati}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleSelectWalkIn(visitor)} className="bg-sky-600 text-white hover:bg-sky-700">
                    <UserCheck className="w-4 h-4 mr-1" /> Seç
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal >


      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Randevuyu Sil"
        message="Bu randevuyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
