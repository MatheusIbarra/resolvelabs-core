"use client";

import { useState } from "react";
import Link from "next/link";
import UsersTab from "./UsersTab";
import CouponsTab from "./CouponsTab";
import AffiliatesTab from "./AffiliatesTab";
import UsageTab from "./UsageTab";
import ActivityTab from "./ActivityTab";

const TABS = [
  { id: "users", label: "Usuários e PRO", Component: UsersTab },
  { id: "coupons", label: "Cupons", Component: CouponsTab },
  { id: "affiliates", label: "Afiliados", Component: AffiliatesTab },
  { id: "usage", label: "Uso das ferramentas", Component: UsageTab },
  { id: "activity", label: "Logs de acesso", Component: ActivityTab },
] as const;

type TabId = (typeof TABS)[number]["id"];

const tabClass = (active: boolean) =>
  `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
    active ? "border-teal-700 text-teal-800" : "border-transparent text-stone-500 hover:text-stone-800"
  }`;

export default function AdminDashboard() {
  const [active, setActive] = useState<TabId>("users");
  const ActiveTab = TABS.find((t) => t.id === active)!.Component;

  return (
    <>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-stone-900">Painel administrativo</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600">Gerencie usuários, cupons, afiliados e tickets de suporte.</p>
      </div>

      <div role="tablist" aria-label="Seções do painel" className="mb-6 flex flex-wrap border-b border-stone-200">
        {TABS.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={tab.id === active} onClick={() => setActive(tab.id)} className={tabClass(tab.id === active)}>
            {tab.label}
          </button>
        ))}
        <Link href="/admin/support" className={`${tabClass(false)} ml-auto`}>
          Tickets de suporte →
        </Link>
      </div>

      <div role="tabpanel">
        <ActiveTab />
      </div>
    </>
  );
}
