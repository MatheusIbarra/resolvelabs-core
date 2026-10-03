"use client";

import { useEffect, useState } from "react";
import { Link, localizeHref } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { apiFetch } from "@/i18n/active";
import Alert from "../ui/Alert";
import { LoadingLabel } from "../ui/Loading";
import { useToast } from "../ui/Toast";
import type { Locale } from "@/i18n/config";

type Mode = "login" | "register";

const ALT_HREF: Record<Mode, string> = { login: "/register", register: "/login" };

/** Só aceita caminhos internos para evitar open redirect. */
function safeNext(locale: Locale): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? localizeHref(locale, next) : localizeHref(locale, "/dashboard");
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: data?.error };
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  // Entre login e cadastro o destino (?next=) precisa acompanhar o usuário.
  const [nextQuery, setNextQuery] = useState("");
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setNextQuery(next && next.startsWith("/") && !next.startsWith("//") ? `?next=${encodeURIComponent(next)}` : "");
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // No cadastro, mostra se o visitante chegou por um link de indicação válido.
  useEffect(() => {
    if (mode !== "register") return;
    let ignore = false;
    apiFetch("/api/referral", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !ignore && setReferralCode(d.code ?? null))
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setIsPending(true);
    try {
      const credentials = { email, password };
      if (mode === "register") {
        if (!termsAccepted) {
          setError(t("auth.termsRequired"));
          return;
        }
        // A indicação vai no cookie resolvelabs_ref (definido pelo middleware em ?ref=CODIGO).
        const registered = await post("/api/auth/register", { ...credentials, termsAccepted });
        if (!registered.ok) {
          setError(registered.error ?? t("msg.auth.network"));
          return;
        }
      }
      const logged = await post("/api/auth/login", credentials);
      if (!logged.ok) {
        setError(logged.error ?? t("msg.auth.network"));
        return;
      }
      toast.success(mode === "register" ? t("msg.auth.registerSuccess") : t("msg.auth.loginSuccess"));
      // Navegação completa: garante que o middleware leia o novo cookie.
      window.location.assign(safeNext(locale));
    } catch {
      setError(t("msg.auth.network"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
      {referralCode && (
        <Alert variant="success" title={t("auth.referral.title")} className="mb-5">
          {t("auth.referral.body", { code: referralCode })}
        </Alert>
      )}
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-stone-900">{t(`auth.${mode}.title`)}</h1>
      <p className="mb-6 text-sm text-stone-600">{t(`auth.${mode}.description`)}</p>

      <form onSubmit={submit} noValidate>
        <label htmlFor="email" className="label">{t("auth.email")}</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          className="input mb-4"
        />

        <label htmlFor="password" className="label">{t("auth.password")}</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "register" ? t("auth.passwordPlaceholderRegister") : t("auth.passwordPlaceholderLogin")}
          className="input mb-5"
        />

        {mode === "register" && (
          <>
            <label htmlFor="terms" className="mb-5 flex cursor-pointer items-start gap-3 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
              <input
                id="terms"
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
              />
              <span>
                {t("auth.termsLead")}{" "}
                <Link href="/termos" target="_blank" className="font-medium text-teal-700 hover:underline">{t("auth.termsLink")}</Link>
              </span>
            </label>
          </>
        )}

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <button type="submit" disabled={isPending || !email || !password || (mode === "register" && !termsAccepted)} className="btn-primary w-full py-3">
          {isPending ? <LoadingLabel>{t(`auth.${mode}.pending`)}</LoadingLabel> : t(`auth.${mode}.submit`)}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-stone-600">
        {t(`auth.${mode}.altText`)}{" "}
        <Link href={`${ALT_HREF[mode]}${nextQuery}`} className="font-medium text-teal-700 hover:underline">{t(`auth.${mode}.altLink`)}</Link>
      </p>
    </div>
  );
}
