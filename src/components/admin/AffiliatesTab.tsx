"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminAffiliate } from "@/lib/adminApi";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";

export default function AffiliatesTab() {
  const tr = useI18n();
  const { t } = tr;
  const [rows, setRows] = useState<AdminAffiliate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows((await adminApi.listAffiliates()).affiliates);
    } catch (err) {
      setError(errorMessage(err, t("msg.admin.loadFailed")));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!rows) return <Loading>{t("admin.affiliates.loading")}</Loading>;

  const totalSignups = rows.reduce((n, r) => n + r.signups, 0);
  const totalConversions = rows.reduce((n, r) => n + r.conversions, 0);

  return (
    <section>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          [t("admin.affiliates.statActive"), rows.length],
          [t("admin.affiliates.statSignups"), totalSignups],
          [t("admin.affiliates.statConversions"), totalConversions],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="mb-1 text-sm text-stone-500">{label}</p>
            <p className="text-3xl font-semibold tracking-tight text-stone-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="table-th">{t("admin.affiliates.code")}</th>
              <th className="table-th">{t("admin.affiliates.owner")}</th>
              <th className="table-th">{t("admin.affiliates.signups")}</th>
              <th className="table-th">{t("admin.affiliates.conversions")}</th>
              <th className="table-th">{t("admin.affiliates.rate")}</th>
              <th className="table-th">{t("admin.affiliates.last")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="table-td py-10 text-center text-stone-500">
                  {t("admin.affiliates.empty")}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.code} className="hover:bg-stone-50">
                <td className="table-td font-mono text-xs font-semibold text-stone-900">{r.code}</td>
                <td className="table-td">{r.ownerEmail ?? "—"}</td>
                <td className="table-td">{r.signups}</td>
                <td className="table-td">{r.conversions}</td>
                <td className="table-td">{r.signups ? Math.round((r.conversions / r.signups) * 100) : 0}%</td>
                <td className="table-td">{tr.date(r.lastSignupAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
