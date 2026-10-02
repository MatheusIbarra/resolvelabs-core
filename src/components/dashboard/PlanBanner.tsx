"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { openBillingPortal } from "@/lib/fakeApi";
import { FREE_PDF_LIMIT } from "@/lib/content";
import { MSG, errorMessage } from "@/lib/messages";
import { Loading, LoadingLabel } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";

export default function PlanBanner() {
  const router = useRouter();
  const toast = useToast();
  const { profile, isLoading, error, refresh } = useAuth();
  const [isOpening, setIsOpening] = useState(false);
  const isPro = profile?.plan === "PRO";
  const stripeManaged = isPro && profile?.hasBilling;

  let message: React.ReactNode;
  if (isLoading) message = <Loading>Verificando sua conta…</Loading>;
  else if (error) message = error;
  else if (stripeManaged) message = "Seu plano atual é o PRO. Você tem acesso ilimitado a todas as ferramentas disponíveis.";
  else if (isPro) message = "Seu plano atual é o PRO. Você tem acesso ilimitado a todas as ferramentas disponíveis.";
  else message = `Seu plano atual é o FREE (${profile?.usageCount ?? 0}/${FREE_PDF_LIMIT} conversões usadas). Assine o PRO para liberar todas as ferramentas.`;

  const manage = async () => {
    setIsOpening(true);
    try {
      window.location.assign(await openBillingPortal());
    } catch (err) {
      toast.error(errorMessage(err, MSG.billing.portalFailed));
      setIsOpening(false);
    }
  };

  const action = error
    ? { label: "Tentar novamente", run: refresh }
    : stripeManaged
      ? { label: isOpening ? <LoadingLabel>Abrindo o portal…</LoadingLabel> : "Gerenciar no Stripe", run: manage }
      : { label: isPro ? "Assinar o PRO" : "Fazer upgrade", run: () => router.push("/checkout") };

  const paymentFailed = Boolean(profile?.paymentFailed) && !isPro;

  return (
    <>
    {paymentFailed && (
      <Alert
        variant="error"
        title="Não conseguimos cobrar seu cartão"
        className="mb-4"
        action={
          <button onClick={manage} disabled={isOpening} className="btn-secondary shrink-0 !px-3 !py-1.5">
            {isOpening ? <LoadingLabel>Abrindo o portal…</LoadingLabel> : "Atualizar pagamento"}
          </button>
        }
      >
        Seu acesso PRO foi suspenso. Atualize a forma de pagamento para reativar.
      </Alert>
    )}
    <section className="card mb-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {!isLoading && profile && <span className={isPro ? "badge-brand" : "badge-neutral"}>{profile.plan}</span>}
        <p className="text-sm text-stone-700">{message}</p>
      </div>
      <button disabled={isLoading || isOpening} onClick={action.run} className="btn-secondary shrink-0">
        {action.label}
      </button>
    </section>
    </>
  );
}
