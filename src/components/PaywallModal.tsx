"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PAYWALL_COPY, PRO_BENEFITS, PRO_PRICE_LABEL, PRO_TRIAL_DAYS, type DenyReason, type PaywallAction } from "@/lib/content";

interface PaywallModalProps {
  isOpen: boolean;
  reason: DenyReason;
  onClose: () => void;
}

const ICON_PATH: Record<DenyReason, string> = {
  // cadeado, alerta, estrela
  AUTH_REQUIRED: "M16 11V7a4 4 0 00-8 0v4M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1z",
  LIMIT_REACHED: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  PRO_REQUIRED: "M11.48 3.5a.56.56 0 011.04 0l2.13 5.11a.56.56 0 00.47.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.29 5.38a.56.56 0 01-.84.61l-4.73-2.89a.56.56 0 00-.58 0l-4.73 2.89a.56.56 0 01-.84-.61l1.29-5.38a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.47-.35l2.13-5.11z",
};

export default function PaywallModal({ isOpen, reason, onClose }: PaywallModalProps) {
  const router = useRouter();
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const copy = PAYWALL_COPY[reason];
  const isAuth = reason === "AUTH_REQUIRED";

  const go = (action: PaywallAction) => {
    const next = action.returnHere ? `?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}` : "";
    router.push(`${action.href}${next}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm animate-[overlay-in_0.2s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-[scale-in_0.25s_cubic-bezier(0.22,1,0.36,1)] sm:p-8"
      >
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${isAuth ? "bg-teal-50 text-teal-700" : "bg-amber-100 text-amber-800"}`}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={ICON_PATH[reason]} />
          </svg>
        </span>
        <span className={`${isAuth ? "badge-brand" : "badge-warn"} mb-3 block w-fit`}>{copy.tag}</span>
        <h2 id="paywall-title" className="mb-2 text-2xl font-semibold tracking-tight text-stone-900">
          {copy.title}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-stone-600">{copy.body}</p>

        {copy.showPro && (
          <ul className="mb-6 space-y-3">
            {PRO_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-stone-800">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <button ref={primaryRef} onClick={() => go(copy.cta)} className="btn-primary w-full py-3">
            {copy.cta.label}
          </button>
          {copy.secondary && (
            <button onClick={() => go(copy.secondary!)} className="btn-secondary w-full py-3">
              {copy.secondary.label}
            </button>
          )}
        </div>

        {copy.showPro && (
          <p className="mt-3 text-center text-xs text-stone-500">
            {PRO_TRIAL_DAYS} dias grátis, depois {PRO_PRICE_LABEL}. Pagamento seguro via Stripe, cancele quando quiser.
          </p>
        )}
      </div>
    </div>
  );
}
