"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "../ui/Toast";
import { LoadingLabel } from "../ui/Loading";

const PRESETS = [7, 30, 90, 365];

interface GrantProModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onGranted: () => void;
}

export default function GrantProModal({ user, onClose, onGranted }: GrantProModalProps) {
  const toast = useToast();
  const { t, tn } = useI18n();
  const [days, setDays] = useState("30");
  const [lifetime, setLifetime] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reinicia o formulário só quando o alvo muda (não a cada render do pai).
  useEffect(() => {
    setDays("30");
    setLifetime(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = lifetime ? null : Number(days);
    if (value !== null && !(Number.isInteger(value) && value >= 1 && value <= 3650)) {
      toast.error(t("msg.admin.invalidDays"));
      return;
    }
    setIsPending(true);
    try {
      await adminApi.grantPro(user.id, value);
      toast.success(value === null ? t("msg.admin.grantedLifetime", { email: user.email }) : tn("msg.admin.granted", value, { email: user.email }), { title: t("msg.admin.grantedTitle") });
      onGranted();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, t("msg.admin.grantFailed")));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="grant-title"
        className="relative w-full max-w-md rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="grant-title" className="text-lg font-semibold text-stone-900">{t("admin.grant.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.ui.close")} className="rounded-md px-2 py-1 text-sm text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">✕</button>
        </div>

        <div className="space-y-5 p-5">
          <p className="break-all text-sm font-medium text-stone-900">{user.email}</p>

          <div>
            <label htmlFor="grant-days" className="label">{t("admin.grant.days")}</label>
            <input
              id="grant-days"
              type="number"
              min={1}
              max={3650}
              value={days}
              disabled={lifetime}
              onChange={(e) => setDays(e.target.value)}
              className="input disabled:bg-stone-100 disabled:text-stone-400"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p} type="button" disabled={lifetime} onClick={() => setDays(String(p))} className="btn-secondary btn-sm">
                  {p}{t("admin.grant.daysShort")}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
            <input type="checkbox" checked={lifetime} onChange={(e) => setLifetime(e.target.checked)} className="h-4 w-4 accent-teal-700" />
            {t("admin.grant.lifetime")}
          </label>

          <p className="text-xs text-stone-500">
            {t("admin.grant.hint")}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-200 p-4">
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">{t("admin.grant.cancel")}</button>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? <LoadingLabel>{t("admin.grant.pending")}</LoadingLabel> : t("admin.grant.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
