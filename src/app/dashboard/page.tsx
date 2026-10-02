import PlanBanner from "@/components/dashboard/PlanBanner";
import ToolsGrid from "@/components/dashboard/ToolsGrid";
import CheckoutSync from "@/components/dashboard/CheckoutSync";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-stone-900">Olá, bem-vindo ao seu painel.</h1>
      <CheckoutSync />
      <PlanBanner />
      <SubscriptionStatus className="-mt-6 mb-10" />
      <ToolsGrid />
    </main>
  );
}
