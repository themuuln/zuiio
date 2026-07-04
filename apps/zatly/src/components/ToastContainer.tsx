"use client";

import { useToastStore } from "@/store/toastStore";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-toast-in pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-sm max-w-md ${
            toast.type === "success"
              ? "bg-green/10 border-green/40 text-green"
              : toast.type === "error"
                ? "bg-red/10 border-red/40 text-red"
                : "bg-surface/95 border-border/80 text-text"
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="font-semibold underline-offset-2 hover:underline cursor-pointer whitespace-nowrap"
              onClick={() => {
                toast.action?.onClick();
                removeToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            className="ml-1 opacity-50 hover:opacity-100 cursor-pointer transition-opacity text-base leading-none"
            onClick={() => removeToast(toast.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
