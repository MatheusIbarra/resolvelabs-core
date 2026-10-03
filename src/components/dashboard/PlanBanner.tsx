"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { openBillingPortal } from "@/lib/fakeApi";
import { FREE_PDF_LIMIT } from "@/lib/content";
import { errorMessage } from "@/lib/messages";
import { Loading, LoadingLabel } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";

export default function PlanBanner() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const { profile, isLoading, error, refresh } = useAuth();
  const [isOpening, setIsOpening] = useState(false);
  const isPro = profile?.plan === "PRO";
  const stripeManaged = isPro && profile?.hasBilling;

  let message: React.ReactNode;
  if (isLoading) message = <Loading>{t("dashboard.planBanner.checking")}</Loading>;
  else if (error) message = error;
  else if (isPro) message = t("dashboard.planBanner.proActive");
  else message = t("dashboard.planBanner.free", { used: profile?.usageCount ?? 0, limit: FREE_PDF_LIMIT });

  const manage = async () => {
    setIsOpening(true);
    try {
      window.location.assign(await openBillingPortal());
    } catch (err) {
      toast.error(errorMessage(err, t("msg.billing.portalFailed")));
      setIsOpening(false);
    }
  };

  const action = error
    ? { label: t("common.ui.tryAgain"), run: refresh }
    : stripeManaged
      ? { label: isOpening ? <LoadingLabel>{t("dashboard.planBanner.openingPortal")}</LoadingLabel> : t("dashboard.planBanner.manage"), run: manage }
      : { label: isPro ? t("dashboard.planBanner.subscribePro") : t("dashboard.planBanner.upgrade"), run: () => router.push("/checkout") };

  const paymentFailed = Boolean(profile?.paymentFailed) && !isPro;

  return (
    <>
    {paymentFailed && (
      <Alert
        variant="error"
        title={t("dashboard.planBanner.paymentFailedTitle")}
        className="mb-4"
        action={
          <button onClick={manage} disabled={isOpening} className="btn-secondary shrink-0 !px-3 !py-1.5">
            {isOpening ? <LoadingLabel>{t("dashboard.planBanner.openingPortal")}</LoadingLabel> : t("dashboard.planBanner.updatePayment")}
          </button>
        }
      >
        {t("dashboard.planBanner.paymentFailedBody")}
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
