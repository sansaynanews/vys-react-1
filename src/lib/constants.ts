
export const APPOINTMENT_STATUS = {
    // A. Karar Aşaması
    PENDING_APPROVAL: {
        id: "PENDING_APPROVAL",
        label: "Onay Bekliyor (Makam)",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: "Clock",
        description: "Talep girildi, Makamın (Vali Bey) onayını bekliyor."
    },
    ON_HOLD: {
        id: "ON_HOLD",
        label: "Havuz (Beklemede)",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: "PauseCircle",
        description: "Beklemeye alındı."
    },
    REJECTED: {
        id: "REJECTED",
        label: "Reddedildi",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "XCircle",
        description: "Doğrudan reddedildi."
    },
    DELEGATED_SUB: {
        id: "DELEGATED_SUB",
        label: "Vali Yrd. / Kaymakam / Birim Amirine Yönlendirme",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: "ArrowRightCircle",
        description: "Vali Yardımcısı, Kaymakam veya Birim Amirine yönlendirildi."
    },
    DELEGATED_UNIT: {
        id: "DELEGATED_UNIT",
        label: "Birim Amirine Yönlendirildi",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: "ArrowRightCircle",
        description: "Birim Amirine yönlendirildi."
    },

    // B. Onay ve Planlama
    APPROVED_WAITING_DATE: {
        id: "APPROVED_WAITING_DATE",
        label: "Makam Onayı",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "CalendarClock",
        description: "Makam 'Uygun' gördü, tarih/saat planlanacak."
    },
    APPROVED: {
        id: "APPROVED",
        label: "Onaylandı",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "CheckCircle2",
        description: "Onaylandı ve tarih/saat atandı."
    },

    // C. Değişiklik Yönetimi
    RESCHEDULE_REQ_VISITOR: {
        id: "RESCHEDULE_REQ_VISITOR",
        label: "Ziyaretçi Erteleme Talebi",
        color: "bg-pink-100 text-pink-800 border-pink-200",
        icon: "History",
        description: "Ziyaretçi erteleme talep etti, Makam onay bekliyor."
    },
    RESCHEDULED_HOST: {
        id: "RESCHEDULED_HOST",
        label: "Ertelendi (Makam)",
        color: "bg-rose-100 text-rose-800 border-rose-200",
        icon: "CalendarX",
        description: "Makam programı nedeniyle tarih değişti."
    },

    // D. Operasyon Günü
    NO_SHOW: {
        id: "NO_SHOW",
        label: "Ziyaretçi Gelmedi",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "UserX",
        description: "Randevu saati geçti, gelen olmadı."
    },
    WAITING_ROOM: {
        id: "WAITING_ROOM",
        label: "Bekleme Alanında",
        color: "bg-sky-100 text-sky-800 border-sky-200",
        icon: "Armchair",
        description: "Geldi, Özel Kalem bekleme alanında."
    },
    IN_MEETING: {
        id: "IN_MEETING",
        label: "Görüşmede",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse",
        icon: "Users",
        description: "Makam odasına girdi, görüşme başladı."
    },
    COMPLETED: {
        id: "COMPLETED",
        label: "Tamamlandı",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: "CheckCheck",
        description: "Görüşme bitti, çıktı."
    },
} as const;

export type AppointmentStatusType = keyof typeof APPOINTMENT_STATUS;

// Yardımcı fonksiyon: Status ID'den detayları döndür
export const getStatusConfig = (statusId: string | undefined | null) => {
    if (!statusId) return APPOINTMENT_STATUS.PENDING_APPROVAL; // Default fallback

    // Eski tip stringler için uyumluluk (migration süreci için)
    if (statusId === "Bekliyor") return APPOINTMENT_STATUS.PENDING_APPROVAL;
    if (statusId === "Onaylandı") return APPOINTMENT_STATUS.APPROVED;
    if (statusId === "Ertelendi") return APPOINTMENT_STATUS.RESCHEDULED_HOST;
    if (statusId === "İptal") return APPOINTMENT_STATUS.REJECTED;
    if (statusId === "Tamamlandı" || statusId === "Görüşüldü") return APPOINTMENT_STATUS.COMPLETED;

    return APPOINTMENT_STATUS[statusId as AppointmentStatusType] || {
        id: statusId,
        label: statusId,
        color: "bg-gray-100 text-gray-600",
        icon: "HelpCircle",
        description: ""
    };
};
