"use client";

import { useMemo, useState } from "react";
import type { OfxData } from "@/utils/fileInspector/types";
import { formatIsoDate, formatMoney, formatNumber } from "@/utils/fileInspector/format";
import { useI18n } from "@/i18n/I18nProvider";
import Alert from "../ui/Alert";
import MetaTable from "./MetaTable";
import { BAR, BTN, DIM, SECTION_LABEL, TABLIST, tabClass } from "./ui";

const STEP = 500;
type SortKey = "date" | "description" | "amount" | "type";

export default function OfxViewer({ data }: { data: OfxData }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"resumo" | "transacoes">("resumo");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: 1 });
  const [shown, setShown] = useState(STEP);
  const currency = data.account.currency ?? "BRL";

  const sorted = useMemo(() => {
    const list = [...data.transactions];
    const { key, dir } = sort;
    list.sort((a, b) => {
      const av = key === "amount" ? a.amount : key === "date" ? (a.date ?? "") : a[key];
      const bv = key === "amount" ? b.amount : key === "date" ? (b.date ?? "") : b[key];
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
    });
    return list;
  }, [data.transactions, sort]);

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? " ↑" : " ↓") : "");

  const accountKind = { bank: t("tools.inspector.ofx.kindBank"), creditcard: t("tools.inspector.ofx.kindCard"), unknown: "—" }[data.account.kind];
  const range = (a?: string | null, b?: string | null) => t("tools.inspector.ofx.periodRange", { from: formatIsoDate(a), to: formatIsoDate(b) });
  const balance = (b: { amount: number; date: string | null }) => t("tools.inspector.ofx.balanceOn", { amount: formatMoney(b.amount, currency), date: formatIsoDate(b.date) });

  return (
    <div>
      <div role="tablist" className={TABLIST}>
        <button role="tab" aria-selected={tab === "resumo"} onClick={() => setTab("resumo")} className={tabClass(tab === "resumo")}>{t("tools.inspector.ofx.summary")}</button>
        <button role="tab" aria-selected={tab === "transacoes"} onClick={() => setTab("transacoes")} className={tabClass(tab === "transacoes")}>
          {t("tools.inspector.ofx.transactions", { count: formatNumber(data.totals.count) })}
        </button>
      </div>

      {data.warnings.length > 0 && (
        <div className="space-y-2 border-b border-stone-200 p-3">
          {data.warnings.slice(0, 5).map((w) => <Alert key={w} variant="warning">{w}</Alert>)}
        </div>
      )}

      {tab === "resumo" ? (
        <div className="grid md:grid-cols-2">
          <div className="md:border-r md:border-stone-200">
            <p className={SECTION_LABEL}>{t("tools.inspector.ofx.bankHeader")}</p>
            <MetaTable
              rows={[
                [t("tools.inspector.ofx.institution"), data.institution.org],
                ["FID", data.institution.fid],
                [t("tools.inspector.ofx.type"), accountKind],
                [t("tools.inspector.ofx.bankId"), data.account.bankId],
                [t("tools.inspector.ofx.branch"), data.account.branchId],
                [t("tools.inspector.ofx.account"), data.account.accountId],
                [t("tools.inspector.ofx.accountType"), data.account.accountType],
                [t("tools.inspector.ofx.currency"), data.account.currency],
                [t("tools.inspector.ofx.period"), data.period.start || data.period.end ? range(data.period.start, data.period.end) : undefined],
              ]}
            />
          </div>
          <div>
            <p className={SECTION_LABEL}>{t("tools.inspector.ofx.balances")}</p>
            <MetaTable
              rows={[
                [t("tools.inspector.ofx.ledger"), data.ledgerBalance ? balance(data.ledgerBalance) : undefined],
                [t("tools.inspector.ofx.available"), data.availableBalance ? balance(data.availableBalance) : undefined],
                [t("tools.inspector.ofx.count"), formatNumber(data.totals.count)],
                [t("tools.inspector.ofx.credits"), <span key="c" className="text-teal-700">{formatMoney(data.totals.credits, currency)}</span>],
                [t("tools.inspector.ofx.debits"), <span key="d" className="text-red-600">{formatMoney(data.totals.debits, currency)}</span>],
                [t("tools.inspector.ofx.result"), formatMoney(data.totals.credits + data.totals.debits, currency)],
                [t("tools.inspector.ofx.version"), data.header.VERSION],
                [t("tools.inspector.ofx.encoding"), [data.header.ENCODING, data.header.CHARSET].filter(Boolean).join(" / ") || undefined],
              ]}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm" data-testid="ofx-table">
              <thead className="sticky top-0 bg-stone-50 text-xs font-medium text-stone-500">
                <tr>
                  {([["date", t("tools.inspector.ofx.colDate")], ["description", t("tools.inspector.ofx.colDescription")], ["amount", t("tools.inspector.ofx.colAmount")], ["type", t("tools.inspector.ofx.colType")]] as [SortKey, string][]).map(([key, label]) => (
                    <th key={key} className="border-b border-stone-200 p-0">
                      <button onClick={() => toggleSort(key)} className="w-full px-4 py-2.5 font-medium hover:text-stone-900" style={{ textAlign: key === "amount" ? "right" : "left" }}>
                        {label}{arrow(key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, shown).map((tx, i) => (
                  <tr key={`${tx.fitid ?? i}-${i}`} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-2 text-stone-700">{formatIsoDate(tx.date)}</td>
                    <td className="max-w-[28rem] truncate px-4 py-2 text-stone-900" title={tx.description}>{tx.description || "—"}</td>
                    <td className={`whitespace-nowrap px-4 py-2 text-right font-medium ${tx.amount < 0 ? "text-red-600" : "text-teal-700"}`}>
                      {formatMoney(tx.amount, currency)}
                    </td>
                    <td className="px-4 py-2"><span className="badge-neutral">{tx.type}</span></td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr><td colSpan={4} className={`px-4 py-10 text-center ${DIM}`}>{t("tools.inspector.ofx.none")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {sorted.length > shown && (
            <div className={`${BAR} border-t border-stone-200`}>
              <span className={DIM}>{t("tools.inspector.ofx.showing", { shown: formatNumber(shown), total: formatNumber(sorted.length) })}</span>
              <button className={BTN} onClick={() => setShown((n) => n + STEP)}>{t("tools.inspector.ofx.showMore", { step: STEP })}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
