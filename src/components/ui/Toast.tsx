"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", onClose, duration = 4000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animate progress bar
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    // Auto close
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: CheckCircle2,
      bg: "bg-gradient-to-r from-emerald-500 to-teal-600",
      subtitle: "İşlem başarılı",
    },
    error: {
      icon: XCircle,
      bg: "bg-gradient-to-r from-red-500 to-rose-600",
      subtitle: "Bir hata oluştu",
    },
    info: {
      icon: Info,
      bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
      subtitle: "Bilgilendirme",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-gradient-to-r from-amber-500 to-orange-600",
      subtitle: "Dikkat",
    },
  };

  const { icon: Icon, bg, subtitle } = config[type];

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl min-w-[320px] max-w-md text-white transition-all duration-300",
        bg,
        isExiting
          ? "opacity-0 translate-x-8 scale-95"
          : "opacity-100 translate-x-0 scale-100"
      )}
      style={{
        animation: isExiting ? undefined : "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
        <Icon className="w-5 h-5 text-white drop-shadow-sm" />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{message}</p>
        <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all flex-shrink-0 hover:scale-110 active:scale-95"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
        <div
          className="h-full bg-white/40 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
