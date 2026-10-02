"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminAffiliate } from "@/lib/adminApi";
import { ADMIN_MSG, errorMessage } from "@/lib/messages";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";
import { MONO, TD, TH, fmtDate } from "./adminUi";

export default function AffiliatesTab() {
  const [rows, setRows] = useState<AdminAffiliate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows((await adminApi.listAffiliates()).affiliates);
    } catch (err) {
      setError(errorMessage(err, ADMIN_MSG.loadFailed));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!rows) return <Loading>Carregando afiliados…</Loading>;

  const totalSignups = rows.reduce((n, r) => n + r.signups, 0);
  const totalConversions = rows.reduce((n, r) => n + r.conversions, 0);

  return (
    <section>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Afiliados ativos", rows.length],
          ["Cadastros indicados", totalSignups],
          ["Conversões em PRO", totalConversions],
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
              <th className={TH}>Código</th>
              <th className={TH}>Dono</th>
              <th className={TH}>Cadastros</th>
              <th className={TH}>Conversões (PRO)</th>
              <th className={TH}>Taxa</th>
              <th className={TH}>Último cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className={`${TD} py-10 text-center text-stone-500`}>
                  Nenhuma indicação ainda. Compartilhe /register?ref=CÓDIGO
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.code} className="hover:bg-stone-50">
                <td className={`${TD} font-mono text-xs font-semibold text-stone-900`}>{r.code}</td>
                <td className={`${TD}`}>{r.ownerEmail ?? "—"}</td>
                <td className={`${TD}`}>{r.signups}</td>
                <td className={`${TD}`}>{r.conversions}</td>
                <td className={`${TD}`}>{r.signups ? Math.round((r.conversions / r.signups) * 100) : 0}%</td>
                <td className={`${TD}`}>{fmtDate(r.lastSignupAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
