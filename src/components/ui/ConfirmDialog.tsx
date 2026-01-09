"use client";

import { useEffect, useRef } from "react";
import { Trash2, AlertTriangle, Info, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Onay Gerekli",
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (open) {
      // Focus cancel button on open
      setTimeout(() => cancelButtonRef.current?.focus(), 100);

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !loading) onClose();
      };
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [open, onClose, loading]);

  if (!open) return null;

  const variantConfig = {
    danger: {
      icon: Trash2,
      iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
      iconShadow: "shadow-red-500/30",
      buttonBg: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
      buttonShadow: "shadow-red-500/25 hover:shadow-red-500/40",
      ringColor: "ring-red-500/20",
      accentColor: "text-red-500",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconShadow: "shadow-amber-500/30",
      buttonBg: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
      buttonShadow: "shadow-amber-500/25 hover:shadow-amber-500/40",
      ringColor: "ring-amber-500/20",
      accentColor: "text-amber-500",
    },
    info: {
      icon: Info,
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      iconShadow: "shadow-blue-500/30",
      buttonBg: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
      buttonShadow: "shadow-blue-500/25 hover:shadow-blue-500/40",
      ringColor: "ring-blue-500/20",
      accentColor: "text-blue-500",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className={cn(
          "absolute inset-0 bg-slate-900/60 backdrop-blur-sm",
          "animate-in fade-in duration-200"
        )}
        onClick={!loading ? onClose : undefined}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full max-w-md mx-4",
          "animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300"
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        {/* Glass Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative top gradient line */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1",
            config.buttonBg
          )} />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              "absolute top-4 right-4 p-1.5 rounded-lg",
              "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon with animation */}
            <div className="flex justify-center mb-5">
              <div className={cn(
                "relative w-16 h-16 rounded-2xl flex items-center justify-center",
                config.iconBg,
                config.iconShadow,
                "shadow-xl",
                "animate-in zoom-in-50 duration-500 delay-100"
              )}>
                <Icon className="w-8 h-8 text-white" />
                {/* Pulse ring effect */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl",
                  config.buttonBg,
                  "animate-ping opacity-30"
                )} style={{ animationDuration: "2s" }} />
              </div>
            </div>

            {/* Title */}
            <h3
              id="confirm-dialog-title"
              className="text-xl font-bold text-slate-800 text-center mb-2"
            >
              {title}
            </h3>

            {/* Message */}
            <p
              id="confirm-dialog-description"
              className="text-slate-600 text-center mb-6 leading-relaxed"
            >
              {message}
            </p>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                ref={cancelButtonRef}
                onClick={onClose}
                disabled={loading}
                className={cn(
                  "flex-1 px-5 py-3 rounded-xl font-semibold text-sm",
                  "bg-slate-100 text-slate-700",
                  "hover:bg-slate-200 active:scale-[0.98]",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                  "flex-1 px-5 py-3 rounded-xl font-semibold text-sm text-white",
                  config.buttonBg,
                  config.buttonShadow,
                  "shadow-lg hover:shadow-xl",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  "flex items-center justify-center gap-2"
                )}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmText}
              </button>
            </div>
          </div>

          {/* Bottom decorative element */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}


