"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminCoupon } from "@/lib/adminApi";
import { ADMIN_MSG, errorMessage } from "@/lib/messages";
import { Loading, LoadingLabel } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";
import { BTN, BTN_SOLID, FIELD, MONO, TD, TH, fmtDate } from "./adminUi";

type CouponStatus = "ativo" | "inativo" | "expirado" | "esgotado";

function statusOf(c: AdminCoupon): CouponStatus {
  if (new Date(c.expiresAt) <= new Date()) return "expirado";
  if (c.usesCount >= c.maxUses) return "esgotado";
  return c.active ? "ativo" : "inativo";
}

const EMPTY_FORM = { code: "", discountPercent: "20", expiresAt: "", maxUses: "100" };

export default function CouponsTab() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCoupons((await adminApi.listCoupons()).coupons);
    } catch (err) {
      setError(errorMessage(err, ADMIN_MSG.loadFailed));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code || !form.expiresAt || !form.discountPercent || !form.maxUses) {
      toast.error(ADMIN_MSG.couponFormInvalid);
      return;
    }
    setIsCreating(true);
    try {
      await adminApi.createCoupon({
        code,
        discountPercent: Number(form.discountPercent),
        expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString(),
        maxUses: Number(form.maxUses),
      });
      toast.success(ADMIN_MSG.couponCreated(code));
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, ADMIN_MSG.couponFailed));
    } finally {
      setIsCreating(false);
    }
  };

  const run = async (coupon: AdminCoupon, action: () => Promise<unknown>, success: string) => {
    setBusyId(coupon.id);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, ADMIN_MSG.actionFailed));
    } finally {
      setBusyId(null);
    }
  };

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const visible = (coupons ?? []).filter((c) => showAll || statusOf(c) === "ativo");
  const labelCls = `${MONO} mb-1.5 block text-stone-500`;

  return (
    <section>
      <form onSubmit={create} className="mb-8 border border-stone-950">
        <div className={`${MONO} bg-stone-950 px-4 py-2.5 text-white`}>Criar novo cupom</div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label htmlFor="c-code" className={labelCls}>Código</label>
            <input id="c-code" value={form.code} onChange={set("code")} placeholder="LANCAMENTO50" maxLength={32} className={`${FIELD} uppercase`} />
          </div>
          <div>
            <label htmlFor="c-pct" className={labelCls}>Desconto (%)</label>
            <input id="c-pct" type="number" min={1} max={100} value={form.discountPercent} onChange={set("discountPercent")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="c-exp" className={labelCls}>Válido até</label>
            <input id="c-exp" type="date" value={form.expiresAt} onChange={set("expiresAt")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="c-max" className={labelCls}>Máx. de usos</label>
            <input id="c-max" type="number" min={1} value={form.maxUses} onChange={set("maxUses")} className={FIELD} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={isCreating} className={`${BTN_SOLID} w-full`}>
              {isCreating ? <LoadingLabel>Criando cupom…</LoadingLabel> : "Criar cupom"}
            </button>
          </div>
        </div>
        <p className="border-t border-stone-950 px-4 py-2 font-mono text-xs text-stone-500">100% = acesso gratuito/vitalício.</p>
      </form>

      <div className="mb-3 flex items-center justify-between">
        <label className={`${MONO} flex cursor-pointer items-center gap-2`}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-4 w-4 accent-stone-950" />
          Mostrar todos (inclui inativos, expirados e esgotados)
        </label>
        {coupons && <span className={`${MONO} text-stone-500`}>{visible.length} / {coupons.length} cupons</span>}
      </div>

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : !coupons ? (
        <Loading>Carregando cupons…</Loading>
      ) : (
        <div className="overflow-x-auto border border-stone-950">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-stone-950 text-white">
              <tr>
                <th className={TH}>Código</th>
                <th className={TH}>Desconto</th>
                <th className={TH}>Validade</th>
                <th className={TH}>Usos</th>
                <th className={TH}>Status</th>
                <th className={`${TH} text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-950">
              {visible.length === 0 && (
                <tr><td colSpan={6} className={`${TD} ${MONO} text-center text-stone-500`}>Nenhum cupom {showAll ? "cadastrado" : "ativo"}</td></tr>
              )}
              {visible.map((c) => {
                const status = statusOf(c);
                return (
                  <tr key={c.id} className="bg-white">
                    <td className={`${TD} font-mono text-sm font-semibold`}>{c.code}</td>
                    <td className={`${TD} font-mono text-xs`}>{c.discountPercent}%</td>
                    <td className={`${TD} font-mono text-xs`}>{fmtDate(c.expiresAt)}</td>
                    <td className={`${TD} font-mono text-xs`}>{c.usesCount}/{c.maxUses}</td>
                    <td className={TD}>
                      <span className={`${MONO} px-1.5 py-0.5 ${status === "ativo" ? "bg-stone-950 text-white" : "border border-stone-400 text-stone-500"}`}>
                        {status}
                      </span>
                    </td>
                    <td className={`${TD} text-right`}>
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busyId === c.id || status === "expirado" || status === "esgotado"}
                          onClick={() => run(c, () => adminApi.setCouponActive(c.id, !c.active), ADMIN_MSG.couponToggled(c.code, !c.active))}
                          className={BTN}
                        >
                          {c.active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          disabled={busyId === c.id}
                          onClick={() => window.confirm(`Excluir o cupom ${c.code}?`) && run(c, () => adminApi.deleteCoupon(c.id), ADMIN_MSG.couponDeleted(c.code))}
                          className={BTN}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
