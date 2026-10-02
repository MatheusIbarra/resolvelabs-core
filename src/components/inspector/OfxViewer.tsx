"use client";

import { useMemo, useState } from "react";
import type { OfxData } from "@/utils/fileInspector/types";
import { formatIsoDate, formatMoney, formatNumber } from "@/utils/fileInspector/format";
import Alert from "../ui/Alert";
import MetaTable from "./MetaTable";
import { BAR, BTN, DIM, SECTION_LABEL, TABLIST, tabClass } from "./ui";

const STEP = 500;
type SortKey = "date" | "description" | "amount" | "type";

export default function OfxViewer({ data }: { data: OfxData }) {
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

  const accountKind = { bank: "Conta bancária", creditcard: "Cartão de crédito", unknown: "—" }[data.account.kind];

  return (
    <div>
      <div role="tablist" className={TABLIST}>
        <button role="tab" aria-selected={tab === "resumo"} onClick={() => setTab("resumo")} className={tabClass(tab === "resumo")}>Resumo</button>
        <button role="tab" aria-selected={tab === "transacoes"} onClick={() => setTab("transacoes")} className={tabClass(tab === "transacoes")}>
          Transações ({formatNumber(data.totals.count)})
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
            <p className={SECTION_LABEL}>Cabeçalho bancário</p>
            <MetaTable
              rows={[
                ["Instituição", data.institution.org],
                ["FID", data.institution.fid],
                ["Tipo", accountKind],
                ["Banco (BANKID)", data.account.bankId],
                ["Agência", data.account.branchId],
                ["Conta", data.account.accountId],
                ["Tipo de conta", data.account.accountType],
                ["Moeda", data.account.currency],
                ["Período", data.period.start || data.period.end ? `${formatIsoDate(data.period.start)} a ${formatIsoDate(data.period.end)}` : undefined],
              ]}
            />
          </div>
          <div>
            <p className={SECTION_LABEL}>Saldos e totais</p>
            <MetaTable
              rows={[
                ["Saldo contábil", data.ledgerBalance ? `${formatMoney(data.ledgerBalance.amount, currency)} em ${formatIsoDate(data.ledgerBalance.date)}` : undefined],
                ["Saldo disponível", data.availableBalance ? `${formatMoney(data.availableBalance.amount, currency)} em ${formatIsoDate(data.availableBalance.date)}` : undefined],
                ["Transações", formatNumber(data.totals.count)],
                ["Total de créditos", <span key="c" className="text-teal-700">{formatMoney(data.totals.credits, currency)}</span>],
                ["Total de débitos", <span key="d" className="text-red-600">{formatMoney(data.totals.debits, currency)}</span>],
                ["Resultado", formatMoney(data.totals.credits + data.totals.debits, currency)],
                ["Versão OFX", data.header.VERSION],
                ["Encoding / charset", [data.header.ENCODING, data.header.CHARSET].filter(Boolean).join(" / ") || undefined],
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
                  {([["date", "Data"], ["description", "Descrição"], ["amount", "Valor"], ["type", "Tipo"]] as [SortKey, string][]).map(([key, label]) => (
                    <th key={key} className="border-b border-stone-200 p-0">
                      <button onClick={() => toggleSort(key)} className="w-full px-4 py-2.5 font-medium hover:text-stone-900" style={{ textAlign: key === "amount" ? "right" : "left" }}>
                        {label}{arrow(key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, shown).map((t, i) => (
                  <tr key={`${t.fitid ?? i}-${i}`} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-2 text-stone-700">{formatIsoDate(t.date)}</td>
                    <td className="max-w-[28rem] truncate px-4 py-2 text-stone-900" title={t.description}>{t.description || "—"}</td>
                    <td className={`whitespace-nowrap px-4 py-2 text-right font-medium ${t.amount < 0 ? "text-red-600" : "text-teal-700"}`}>
                      {formatMoney(t.amount, currency)}
                    </td>
                    <td className="px-4 py-2"><span className="badge-neutral">{t.type}</span></td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr><td colSpan={4} className={`px-4 py-10 text-center ${DIM}`}>Nenhuma transação neste arquivo.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {sorted.length > shown && (
            <div className={`${BAR} border-t border-stone-200`}>
              <span className={DIM}>Mostrando {formatNumber(shown)} de {formatNumber(sorted.length)}</span>
              <button className={BTN} onClick={() => setShown((n) => n + STEP)}>Mostrar mais {STEP}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
