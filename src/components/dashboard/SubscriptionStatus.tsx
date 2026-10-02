"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { describeSubscription } from "@/lib/subscription";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";

const BADGE = { brand: "badge-brand", warn: "badge-warn", neutral: "badge-neutral" } as const;
const COUNTER = {
  brand: "bg-teal-50 text-teal-800",
  warn: "bg-amber-50 text-amber-800",
  neutral: "bg-stone-100 text-stone-700",
} as const;

/** Mostra ao cliente quanto tempo resta: teste grátis, próxima cobrança, cancelamento ou expiração. */
export default function SubscriptionStatus({ className = "" }: { className?: string }) {
  const { summary, bonusDays, isLoading, error } = useSubscription();

  if (isLoading && !summary) {
    return <div className={className}><Loading>Carregando sua assinatura…</Loading></div>;
  }
  if (error) return <Alert variant="warning" className={className}>{error}</Alert>;

  const view = summary ? describeSubscription(summary) : null;
  if (!view) return null;

  return (
    <section className={`card flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${className}`} aria-label="Situação da assinatura">
      {view.days !== null && (
        <div className={`shrink-0 rounded-lg px-5 py-3 text-center sm:min-w-36 ${COUNTER[view.tone]}`}>
          <p className="text-3xl font-semibold leading-none">{view.days}</p>
          <p className="mt-1.5 text-xs leading-tight">{view.daysCaption}</p>
        </div>
      )}
      <div className="min-w-0">
        <span className={`${BADGE[view.tone]} mb-2`}>{view.label}</span>
        <p className="text-sm leading-relaxed text-stone-700">{view.message}</p>
        {bonusDays > 0 && view.days !== null && (
          <p className="mt-1.5 text-xs text-stone-500">Inclui {bonusDays} dias de bônus de indicação.</p>
        )}
      </div>
    </section>
  );
}
