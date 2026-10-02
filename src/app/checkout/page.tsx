"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageHeading from "@/components/PageHeading";
import { Loading, LoadingLabel } from "@/components/ui/Loading";
import Alert from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";
import { useAuth } from "@/hooks/useAuth";
import { openBillingPortal, startCheckout, validateCoupon } from "@/lib/fakeApi";
import { PRO_BENEFITS, PRO_PRICE_LABEL, PRO_TRIAL_DAYS } from "@/lib/content";
import { MSG, errorMessage } from "@/lib/messages";

export default function CheckoutPage() {
  const toast = useToast();
  const { profile, isLoading, error: profileError } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  const isPro = profile?.plan === "PRO";
  const managedByStripe = isPro && profile?.hasBilling;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("checkout") === "canceled") {
      toast.info(MSG.billing.checkoutCanceled);
      window.history.replaceState(window.history.state, "", "/checkout");
    }
  }, [toast]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsCheckingCoupon(true);
    setCouponError(null);
    try {
      setCoupon(await validateCoupon(couponInput));
    } catch (err) {
      setCoupon(null);
      setCouponError(errorMessage(err, MSG.billing.couponFailed));
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const subscribe = async () => {
    setIsPending(true);
    try {
      const result = await startCheckout(coupon?.code);
      if (result.redeemed) {
        window.location.assign("/dashboard?checkout=success"); // o painel confirma o PRO
      } else if (result.url) {
        window.location.assign(result.url); // redireciona para o Stripe
      } else {
        throw new Error(MSG.billing.checkoutFailed);
      }
    } catch (err) {
      toast.error(errorMessage(err, MSG.billing.checkoutFailed));
      setIsPending(false);
    }
  };

  const goTo = async (getUrl: () => Promise<string>, fallback: string) => {
    setIsPending(true);
    try {
      window.location.assign(await getUrl()); // redireciona para o Stripe
    } catch (err) {
      toast.error(errorMessage(err, fallback));
      setIsPending(false);
    }
  };

  const isFreeCoupon = coupon?.discountPercent === 100;
  let label = isFreeCoupon ? "Ativar PRO gratuito" : `Começar teste grátis de ${PRO_TRIAL_DAYS} dias`;
  let pendingLabel: React.ReactNode = <LoadingLabel>Abrindo o checkout…</LoadingLabel>;
  let action = subscribe;
  if (managedByStripe) {
    label = "Gerenciar assinatura";
    pendingLabel = <LoadingLabel>Abrindo o portal…</LoadingLabel>;
    action = () => goTo(openBillingPortal, MSG.billing.portalFailed);
  } else if (isPro) {
    label = "Assinar para manter o acesso";
  }

  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Assinatura"]} />
      <main className="page-container max-w-4xl flex-1 pb-20">
        <PageHeading
          title="ResolveLabs PRO"
          description={`Acesso ilimitado a todas as ferramentas. Teste ${PRO_TRIAL_DAYS} dias grátis e cancele quando quiser.`}
        />
        <SubscriptionStatus className="mb-6" />
        <div className="grid gap-6 md:grid-cols-5">
          <section className="card p-6 md:col-span-3">
            <h2 className="section-title mb-4">O que está incluso</h2>
            <ul className="space-y-3">
              {PRO_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-stone-800">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </section>

          <section className="card flex flex-col p-6 md:col-span-2">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-stone-500">Plano atual</span>
              {isLoading ? <Loading>Verificando…</Loading> : <span className="font-medium text-stone-900">{profile?.plan ?? "--"}</span>}
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-stone-900">{PRO_PRICE_LABEL}</p>
            <p className="mb-6 text-sm text-stone-600">{PRO_TRIAL_DAYS} dias grátis para começar</p>

            {!managedByStripe && !isPro && (
              <div className="mb-4">
                {coupon ? (
                  <div className="flex items-center justify-between rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                    <span>
                      Cupom <strong>{coupon.code}</strong>: {isFreeCoupon ? "acesso gratuito" : `${coupon.discountPercent}% de desconto`}
                    </span>
                    <button type="button" onClick={removeCoupon} className="text-xs underline">Remover</button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="coupon" className="mb-1 block text-xs text-stone-500">Tem um cupom?</label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        className="input flex-1 uppercase"
                        value={couponInput}
                        maxLength={32}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        placeholder="CÓDIGO"
                      />
                      <button type="button" onClick={applyCoupon} disabled={isCheckingCoupon || !couponInput.trim()} className="btn-secondary">
                        {isCheckingCoupon ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {couponError && <p className="mt-1 text-xs text-red-700">{couponError}</p>}
                  </>
                )}
              </div>
            )}

            {profileError && <Alert variant="error" className="mb-3">{profileError}</Alert>}

            <button onClick={action} disabled={isLoading || isPending || !profile} className="btn-primary mt-auto w-full py-3">
              {isPending ? pendingLabel : label}
            </button>
            <p className="mt-3 text-xs text-stone-500">Pagamento seguro via Stripe. Cartão necessário; você só é cobrado após o teste.</p>
          </section>
        </div>
      </main>
    </>
  );
}
