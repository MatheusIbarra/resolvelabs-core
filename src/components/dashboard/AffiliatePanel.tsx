"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAffiliate, type AffiliateInfo } from "@/lib/fakeApi";
import { AFFILIATE_REWARD_DAYS } from "@/lib/content";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";

export default function AffiliatePanel() {
  const toast = useToast();
  const { t } = useI18n();
  const [info, setInfo] = useState<AffiliateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setInfo(await getAffiliate());
    } catch (err) {
      setError(errorMessage(err, t("msg.affiliate.loadFailed")));
    }
  }, [t]);

  useEffect(() => {
    load();
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, [load]);

  const copy = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.link);
      setCopied(true);
      toast.success(t("msg.affiliate.copied"), { title: t("msg.affiliate.copiedTitle") });
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select(); // facilita a cópia manual
      toast.error(t("msg.affiliate.copyFailed"));
    }
  };

  return (
    <>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-stone-900">{t("dashboard.affiliate.title")}</h1>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-stone-600">
        {t("dashboard.affiliate.intro", { days: AFFILIATE_REWARD_DAYS })}
      </p>

      {error ? (
        <Alert variant="error" action={<button onClick={load} className="btn-secondary shrink-0 !px-3 !py-1.5">{t("common.ui.tryAgain")}</button>}>
          {error}
        </Alert>
      ) : !info ? (
        <Loading>{t("dashboard.affiliate.loading")}</Loading>
      ) : (
        <>
          <section className="card mb-6 p-5">
            <label htmlFor="ref-link" className="label">{t("dashboard.affiliate.linkLabel")}</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="ref-link"
                ref={inputRef}
                readOnly
                value={info.link}
                onFocus={(e) => e.currentTarget.select()}
                className="input"
              />
              <button onClick={copy} className="btn-primary shrink-0 sm:min-w-36">
                {copied ? t("dashboard.affiliate.copied") : t("dashboard.affiliate.copyLink")}
              </button>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              {t("dashboard.affiliate.yourCode")} <span className="font-semibold text-stone-800">{info.code}</span>
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <p className="mb-1 text-sm text-stone-500">{t("dashboard.affiliate.referred")}</p>
              <p className="text-4xl font-semibold tracking-tight text-stone-900">{info.referredCount}</p>
              <p className="mt-2 text-xs text-stone-500">{t("dashboard.affiliate.converted", { count: info.convertedCount })}</p>
            </div>
            <div className="card p-5">
              <p className="mb-1 text-sm text-stone-500">{t("dashboard.affiliate.rewards")}</p>
              <p className="text-4xl font-semibold tracking-tight text-stone-900">
                {info.rewardDays} <span className="text-lg font-medium text-stone-500">{t("dashboard.affiliate.proDays")}</span>
              </p>
              <p className="mt-2 text-xs text-stone-500">{t("dashboard.affiliate.perReferral", { days: info.rewardDaysPerReferral })}</p>
            </div>
          </section>
        </>
      )}
    </>
  );
}
