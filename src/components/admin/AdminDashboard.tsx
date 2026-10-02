"use client";

import { useState } from "react";
import Link from "next/link";
import UsersTab from "./UsersTab";
import CouponsTab from "./CouponsTab";
import AffiliatesTab from "./AffiliatesTab";
import { MONO } from "./adminUi";

const TABS = [
  { id: "users", label: "01 Usuários & PRO", Component: UsersTab },
  { id: "coupons", label: "02 Cupons", Component: CouponsTab },
  { id: "affiliates", label: "03 Afiliados", Component: AffiliatesTab },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboard() {
  const [active, setActive] = useState<TabId>("users");
  const ActiveTab = TABS.find((t) => t.id === active)!.Component;

  return (
    <>
      <div className="mb-8 border-b border-stone-950 pb-6">
        <p className={`${MONO} mb-3 text-stone-500`}>Área restrita / admin</p>
        <h1 className="font-mono text-2xl font-semibold uppercase tracking-tight text-stone-950 md:text-3xl">
          Painel administrativo
        </h1>
      </div>

      <div role="tablist" aria-label="Seções do painel" className="mb-8 flex flex-wrap border border-stone-950">
        {TABS.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={`${MONO} px-5 py-3 transition-colors ${i > 0 ? "border-l border-stone-950" : ""} ${
                selected ? "bg-stone-950 text-white" : "bg-white text-stone-950 hover:bg-stone-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <Link href="/admin/support" className={`${MONO} border-l border-stone-950 bg-white px-5 py-3 text-stone-950 transition-colors hover:bg-stone-100`}>
          04 Suporte ↗
        </Link>
      </div>

      <div role="tabpanel">
        <ActiveTab />
      </div>
    </>
  );
}
