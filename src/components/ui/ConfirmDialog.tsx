"use client";

import { AlertCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

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
  const variantStyles = {
    danger: {
      icon: "text-red-600 bg-red-100",
      button: "danger" as const,
    },
    warning: {
      icon: "text-amber-600 bg-amber-100",
      button: "primary" as const,
    },
    info: {
      icon: "text-blue-600 bg-blue-100",
      button: "primary" as const,
    },
  };

  const style = variantStyles[variant];

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${style.icon}`}
          >
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={style.button}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
