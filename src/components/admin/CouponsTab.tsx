"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminCoupon } from "@/lib/adminApi";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { Loading, LoadingLabel } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";

type CouponStatus = "active" | "inactive" | "expired" | "exhausted";

const STATUS_KEY = { active: "statusActive", inactive: "statusInactive", expired: "statusExpired", exhausted: "statusExhausted" } as const;

function statusOf(c: AdminCoupon): CouponStatus {
  if (new Date(c.expiresAt) <= new Date()) return "expired";
  if (c.usesCount >= c.maxUses) return "exhausted";
  return c.active ? "active" : "inactive";
}

const EMPTY_FORM = { code: "", discountPercent: "20", expiresAt: "", maxUses: "100" };

export default function CouponsTab() {
  const toast = useToast();
  const tr = useI18n();
  const { t } = tr;
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
      setError(errorMessage(err, t("msg.admin.loadFailed")));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code || !form.expiresAt || !form.discountPercent || !form.maxUses) {
      toast.error(t("msg.admin.couponFormInvalid"));
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
      toast.success(t("msg.admin.couponCreated", { code }));
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, t("msg.admin.couponFailed")));
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
      toast.error(errorMessage(err, t("msg.admin.actionFailed")));
    } finally {
      setBusyId(null);
    }
  };

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const visible = (coupons ?? []).filter((c) => showAll || statusOf(c) === "active");
  const labelCls = "label";

  return (
    <section>
      <form onSubmit={create} className="card mb-8">
        <div className="border-b border-stone-200 px-5 py-3.5">
          <h2 className="section-title">{t("admin.coupons.create")}</h2>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label htmlFor="c-code" className={labelCls}>{t("admin.coupons.code")}</label>
            <input id="c-code" value={form.code} onChange={set("code")} placeholder={t("admin.coupons.codePlaceholder")} maxLength={32} className="input uppercase" />
          </div>
          <div>
            <label htmlFor="c-pct" className={labelCls}>{t("admin.coupons.discount")}</label>
            <input id="c-pct" type="number" min={1} max={100} value={form.discountPercent} onChange={set("discountPercent")} className="input" />
          </div>
          <div>
            <label htmlFor="c-exp" className={labelCls}>{t("admin.coupons.validUntil")}</label>
            <input id="c-exp" type="date" value={form.expiresAt} onChange={set("expiresAt")} className="input" />
          </div>
          <div>
            <label htmlFor="c-max" className={labelCls}>{t("admin.coupons.maxUses")}</label>
            <input id="c-max" type="number" min={1} value={form.maxUses} onChange={set("maxUses")} className="input" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={isCreating} className="btn-primary w-full">
              {isCreating ? <LoadingLabel>{t("admin.coupons.creating")}</LoadingLabel> : t("admin.coupons.submit")}
            </button>
          </div>
        </div>
        <p className="border-t border-stone-200 px-5 py-3 text-xs text-stone-500">{t("admin.coupons.hint")}</p>
      </form>

      <div className="mb-3 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-4 w-4 accent-teal-700" />
          {t("admin.coupons.showAll")}
        </label>
        {coupons && <span className="text-sm text-stone-500">{t("admin.coupons.count", { shown: visible.length, total: coupons.length })}</span>}
      </div>

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : !coupons ? (
        <Loading>{t("admin.coupons.loading")}</Loading>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="table-th">{t("admin.coupons.code")}</th>
                <th className="table-th">{t("admin.coupons.discountCol")}</th>
                <th className="table-th">{t("admin.coupons.validity")}</th>
                <th className="table-th">{t("admin.coupons.uses")}</th>
                <th className="table-th">{t("admin.coupons.status")}</th>
                <th className="table-th text-right">{t("admin.coupons.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.length === 0 && (
                <tr><td colSpan={6} className="table-td py-10 text-center text-stone-500">{showAll ? t("admin.coupons.emptyAll") : t("admin.coupons.emptyActive")}</td></tr>
              )}
              {visible.map((c) => {
                const status = statusOf(c);
                return (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="table-td font-mono text-xs font-semibold text-stone-900">{c.code}</td>
                    <td className="table-td">{c.discountPercent}%</td>
                    <td className="table-td">{tr.date(c.expiresAt)}</td>
                    <td className="table-td">{c.usesCount}/{c.maxUses}</td>
                    <td className="table-td">
                      <span className={status === "active" ? "badge-brand" : status === "inactive" ? "badge-neutral" : "badge-warn"}>
                        {t(`admin.coupons.${STATUS_KEY[status]}`)}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busyId === c.id || status === "expired" || status === "exhausted"}
                          onClick={() => run(c, () => adminApi.setCouponActive(c.id, !c.active), !c.active ? t("msg.admin.couponActivated", { code: c.code }) : t("msg.admin.couponDeactivated", { code: c.code }))}
                          className="btn-secondary btn-sm"
                        >
                          {c.active ? t("admin.coupons.deactivate") : t("admin.coupons.activate")}
                        </button>
                        <button
                          disabled={busyId === c.id}
                          onClick={() => window.confirm(t("admin.coupons.confirmDelete", { code: c.code })) && run(c, () => adminApi.deleteCoupon(c.id), t("msg.admin.couponDeleted", { code: c.code }))}
                          className="btn-secondary btn-sm"
                        >
                          {t("admin.coupons.delete")}
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
