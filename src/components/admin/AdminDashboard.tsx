"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import UsersTab from "./UsersTab";
import CouponsTab from "./CouponsTab";
import AffiliatesTab from "./AffiliatesTab";
import UsageTab from "./UsageTab";
import ActivityTab from "./ActivityTab";

const TABS = [
  { id: "users", labelKey: "tabUsers", Component: UsersTab },
  { id: "coupons", labelKey: "tabCoupons", Component: CouponsTab },
  { id: "affiliates", labelKey: "tabAffiliates", Component: AffiliatesTab },
  { id: "usage", labelKey: "tabUsage", Component: UsageTab },
  { id: "activity", labelKey: "tabActivity", Component: ActivityTab },
] as const;

type TabId = (typeof TABS)[number]["id"];

const tabClass = (active: boolean) =>
  `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
    active ? "border-teal-700 text-teal-800" : "border-transparent text-stone-500 hover:text-stone-800"
  }`;

export default function AdminDashboard() {
  const { t } = useI18n();
  const [active, setActive] = useState<TabId>("users");
  const ActiveTab = TABS.find((t) => t.id === active)!.Component;

  return (
    <>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-stone-900">{t("admin.dashboard.title")}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600">{t("admin.dashboard.description")}</p>
      </div>

      <div role="tablist" aria-label={t("admin.dashboard.tabsAria")} className="mb-6 flex flex-wrap border-b border-stone-200">
        {TABS.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={tab.id === active} onClick={() => setActive(tab.id)} className={tabClass(tab.id === active)}>
            {t(`admin.dashboard.${tab.labelKey}`)}
          </button>
        ))}
        <Link href="/admin/support" className={`${tabClass(false)} ml-auto`}>
          {t("admin.dashboard.supportLink")}
        </Link>
      </div>

      <div role="tabpanel">
        <ActiveTab />
      </div>
    </>
  );
}
