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
  const [isPending, setIsPending] = useState(false);
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
        // A indicação vai no cookie resolvelabs_ref (definido pelo middleware em ?ref=CODIGO).
        const registered = await post("/api/auth/register", credentials);
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

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <button type="submit" disabled={isPending || !email || !password} className="btn-primary w-full py-3">
          {isPending ? <LoadingLabel>{copy.pending}</LoadingLabel> : copy.submit}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-stone-600">
        {copy.altText}{" "}
        <Link href={copy.altHref} className="font-medium text-teal-700 hover:underline">{copy.altLink}</Link>
      </p>
    </div>
  );
}
