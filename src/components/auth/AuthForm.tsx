"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "../ui/Alert";
import { LoadingLabel } from "../ui/Loading";
import { useToast } from "../ui/Toast";
import { AUTH_MSG } from "@/lib/messages";

type Mode = "login" | "register";

const COPY: Record<Mode, { title: string; description: string; submit: string; pending: string; altText: string; altLink: string; altHref: string }> = {
  login: {
    title: "Entrar na sua conta",
    description: "Acesse seu painel e suas ferramentas.",
    submit: "Entrar",
    pending: "Entrando…",
    altText: "Ainda não tem conta?",
    altLink: "Criar conta",
    altHref: "/register",
  },
  register: {
    title: "Criar conta gratuita",
    description: "Comece no plano FREE. Você pode assinar o PRO quando quiser.",
    submit: "Criar conta",
    pending: "Criando sua conta…",
    altText: "Já tem conta?",
    altLink: "Entrar",
    altHref: "/login",
  },
};

/** Máscara brasileira: (XX) XXXXX-XXXX. */
function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Só aceita caminhos internos para evitar open redirect. */
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: data?.error };
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
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
    fetch("/api/referral", { cache: "no-store" })
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
        if (phone.replace(/\D/g, "").length !== 11) {
          setError("Informe um celular válido com DDD: (XX) XXXXX-XXXX.");
          return;
        }
        if (!termsAccepted) {
          setError("É necessário aceitar os Termos de Uso.");
          return;
        }
        // A indicação vai no cookie resolvelabs_ref (definido pelo middleware em ?ref=CODIGO).
        const registered = await post("/api/auth/register", { ...credentials, phone, termsAccepted });
        if (!registered.ok) {
          setError(registered.error ?? AUTH_MSG.network);
          return;
        }
      }
      const logged = await post("/api/auth/login", credentials);
      if (!logged.ok) {
        setError(logged.error ?? AUTH_MSG.network);
        return;
      }
      toast.success(mode === "register" ? AUTH_MSG.registerSuccess : AUTH_MSG.loginSuccess);
      // Navegação completa: garante que o middleware leia o novo cookie.
      window.location.assign(safeNext());
    } catch {
      setError(AUTH_MSG.network);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
      {referralCode && (
        <Alert variant="success" title="Você foi convidado(a) por um amigo" className="mb-5">
          Indicação aplicada (código <span className="font-mono font-semibold">{referralCode}</span>). Crie sua conta para começar.
        </Alert>
      )}
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-stone-900">{copy.title}</h1>
      <p className="mb-6 text-sm text-stone-600">{copy.description}</p>

      <form onSubmit={submit} noValidate>
        <label htmlFor="email" className="label">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@empresa.com"
          className="input mb-4"
        />

        <label htmlFor="password" className="label">Senha</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "register" ? "Mínimo de 8 caracteres" : "Sua senha"}
          className="input mb-5"
        />

        {mode === "register" && (
          <>
            <label htmlFor="phone" className="label">Celular</label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(11) 91234-5678"
              className="input mb-5"
            />

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
                Li e concordo com os{" "}
                <Link href="/termos" target="_blank" className="font-medium text-teal-700 hover:underline">Termos de Uso</Link>
              </span>
            </label>
          </>
        )}

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <button type="submit" disabled={isPending || !email || !password || (mode === "register" && (!phone || !termsAccepted))} className="btn-primary w-full py-3">
          {isPending ? <LoadingLabel>{copy.pending}</LoadingLabel> : copy.submit}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-stone-600">
        {copy.altText}{" "}
        <Link href={`${copy.altHref}${nextQuery}`} className="font-medium text-teal-700 hover:underline">{copy.altLink}</Link>
      </p>
    </div>
  );
}
