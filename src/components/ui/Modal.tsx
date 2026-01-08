"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  const isOpen = open;
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full mx-4 animate-in zoom-in-95 flex flex-col max-h-[85vh]",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  variant = "danger",
}: ConfirmModalProps) {
  const colors = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  const iconBg = {
    danger: "bg-red-100 text-red-600",
    warning: "bg-amber-100 text-amber-600",
    info: "bg-blue-100 text-blue-600",
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4", iconBg[variant])}>
          <X className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn("flex-1 py-2.5 rounded-xl text-white font-bold transition", colors[variant])}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
