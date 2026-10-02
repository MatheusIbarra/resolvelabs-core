"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PAYWALL_COPY, PRO_BENEFITS, PRO_TRIAL_DAYS, type DenyReason } from "@/lib/content";

interface PaywallModalProps {
  isOpen: boolean;
  reason: DenyReason;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, reason, onClose }: PaywallModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const copy = PAYWALL_COPY[reason];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-[2px] animate-[overlay-in_0.2s_ease-out]"
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

        <span className="badge-warn mb-4">{copy.tag}</span>
        <h2 id="paywall-title" className="mb-2 text-2xl font-semibold tracking-tight text-stone-900">
          {copy.title}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-stone-600">{copy.body}</p>

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

        <button onClick={() => router.push("/checkout")} className="btn-primary w-full py-3">
          Testar {PRO_TRIAL_DAYS} dias grátis
        </button>
        <p className="mt-3 text-center text-xs text-stone-500">Depois R$ 7,99/mês. Pagamento seguro via Stripe, cancele quando quiser.</p>
      </div>
    </div>
  );
}
