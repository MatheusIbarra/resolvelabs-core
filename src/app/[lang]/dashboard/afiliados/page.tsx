import type { Metadata } from "next";
import AffiliatePanel from "@/components/dashboard/AffiliatePanel";
import { getTranslator, pageLocale, type LangParams } from "@/i18n/server";
import { privateTitle } from "@/i18n/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return { title: privateTitle(getTranslator(await pageLocale(params)).t("dashboard.meta.referrals")) };
}

export default function AffiliatesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <AffiliatePanel />
    </main>
  );
}
