"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { VARIANT_STYLES, VariantIcon, type Variant } from "./icons";

interface ToastOptions {
  title?: string;
  /** Duração em ms. 0 = não fecha sozinho. */
  duration?: number;
}

interface ToastItem {
  id: number;
  variant: Variant;
  message: string;
  title?: string;
}

interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const DEFAULT_DURATION: Record<Variant, number> = { success: 4000, info: 4000, warning: 6000, error: 7000 };
const MAX_VISIBLE = 4;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t: tr } = useI18n();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: Variant, message: string, options?: ToastOptions) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, variant, message, title: options?.title }]);
      const duration = options?.duration ?? DEFAULT_DURATION[variant];
      if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, o) => push("success", m, o),
      error: (m, o) => push("error", m, o),
      warning: (m, o) => push("warning", m, o),
      info: (m, o) => push("info", m, o),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex animate-[toast-in_0.3s_cubic-bezier(0.22,1,0.36,1)] items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg ${VARIANT_STYLES[t.variant].box.split(" ")[0]}`}
          >
            <VariantIcon variant={t.variant} />
            <div className="min-w-0 flex-1 text-stone-800">
              {t.title && <p className="font-medium text-stone-900">{t.title}</p>}
              <p className={t.title ? "text-stone-600" : ""}>{t.message}</p>
            </div>
            <button
              aria-label={tr("common.ui.closeNotification")}
              onClick={() => dismiss(t.id)}
              className="-mr-1 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
