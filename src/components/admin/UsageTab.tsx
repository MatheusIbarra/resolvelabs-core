"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminToolStatRow } from "@/lib/adminApi";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";

const PERIODS = [7, 30, 90];

export default function UsageTab() {
  const { t, raw } = useI18n();
  const kindLabel = raw("admin.usage.kind") as Record<string, string>;
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<AdminToolStatRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setRows(null);
    try {
      setRows((await adminApi.toolStats(days)).rows);
    } catch (err) {
      setError(errorMessage(err, t("msg.admin.loadFailed")));
    }
  }, [days, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Alert variant="error">{error}</Alert>;

  const tools = rows ? [...new Set(rows.map((r) => r.tool))] : [];
  const sum = (tool: string, event: string, kind?: string) =>
    (rows ?? []).filter((r) => r.tool === tool && r.event === event && (kind === undefined || r.kind === kind)).reduce((n, r) => n + r.count, 0);
  const summary = tools
    .map((tool) => {
      const views = sum(tool, "view");
      const uses = sum(tool, "use");
      const kinds = [...new Set((rows ?? []).filter((r) => r.tool === tool && r.event === "use" && r.kind).map((r) => r.kind))]
        .map((k) => ({ kind: k, n: sum(tool, "use", k) }))
        .sort((a, b) => b.n - a.n);
      return { tool, views, uses, kinds };
    })
    .sort((a, b) => b.views + b.uses - (a.views + a.uses));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-stone-600">
          {t("admin.usage.intro")}
        </p>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p} className={p === days ? "btn-primary btn-sm" : "btn-secondary btn-sm"} onClick={() => setDays(p)}>
              {t("admin.usage.period", { days: p })}
            </button>
          ))}
        </div>
      </div>

      {!rows ? (
        <Loading>{t("admin.usage.loading")}</Loading>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="table-th">{t("admin.usage.page")}</th>
                <th className="table-th">{t("admin.usage.visits")}</th>
                <th className="table-th">{t("admin.usage.uses")}</th>
                <th className="table-th">{t("admin.usage.rate")}</th>
                <th className="table-th">{t("admin.usage.kinds")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {summary.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-td py-10 text-center text-stone-500">{t("admin.usage.empty")}</td>
                </tr>
              )}
              {summary.map((s) => (
                <tr key={s.tool} className="hover:bg-stone-50">
                  <td className="table-td font-mono text-xs font-semibold text-stone-900">{s.tool}</td>
                  <td className="table-td">{s.views}</td>
                  <td className="table-td">{s.uses}</td>
                  <td className="table-td">{s.views ? Math.round((s.uses / s.views) * 100) : 0}%</td>
                  <td className="table-td">{s.kinds.length ? s.kinds.map((k) => `${kindLabel[k.kind] ?? k.kind}: ${k.n}`).join(" · ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
