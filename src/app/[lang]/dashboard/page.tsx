import PlanBanner from "@/components/dashboard/PlanBanner";
import ToolsGrid from "@/components/dashboard/ToolsGrid";
import CheckoutSync from "@/components/dashboard/CheckoutSync";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";

export default async function DashboardPage({ params }: LangParams) {
  const { t } = getTranslator(await pageLocale(params));
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-stone-900">{t("dashboard.welcome")}</h1>
      <CheckoutSync />
      <PlanBanner />
      <SubscriptionStatus className="-mt-6 mb-10" />
      <ToolsGrid />
    </main>
  );
}
