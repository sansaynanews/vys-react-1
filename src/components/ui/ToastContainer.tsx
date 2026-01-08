"use client";

import { useToastStore } from "@/hooks/useToastStore";
import { Toast } from "./Toast";

export function ToastContainer() {
  const { toasts, hideToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>
  );
}
