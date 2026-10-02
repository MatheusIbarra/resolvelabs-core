"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkToolAccess } from "@/lib/fakeApi";
import type { DenyReason } from "@/lib/content";
import PaywallModal from "../PaywallModal";
import { LoadingScreen } from "../ui/Loading";

type State =
  | { status: "validating" }
  | { status: "allowed" }
  | { status: "denied"; reason: DenyReason }
  | { status: "error"; message: string };

/** Valida o acesso na "API" antes de renderizar a ferramenta (cobre acesso direto pela URL). */
export default function ToolGuard({ slug, children }: { slug: string; children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "validating" });
  const [modalOpen, setModalOpen] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState({ status: "validating" });
    checkToolAccess(slug)
      .then((r) => {
        if (ignore) return;
        setState(r.allowed ? { status: "allowed" } : { status: "denied", reason: r.reason });
        setModalOpen(true);
      })
      .catch((err) => {
        if (!ignore) setState({ status: "error", message: err instanceof Error ? err.message : "Falha ao validar permissão." });
      });
    return () => {
      ignore = true;
    };
  }, [slug, attempt]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  if (state.status === "validating") return <LoadingScreen label="Verificando seu acesso…" />;
  if (state.status === "allowed") return <>{children}</>;

  return (
    <div className="card p-10 text-center">
      <p className="mb-2 text-lg font-semibold text-stone-900">
        {state.status === "error" ? "Não foi possível validar o acesso" : "Acesso restrito ao plano PRO"}
      </p>
      <p className="mb-6 text-sm text-stone-600">
        {state.status === "error" ? state.message : "Assine o PRO para usar esta ferramenta."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {state.status === "error" ? (
          <button className="btn-primary" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</button>
        ) : (
          <button className="btn-primary" onClick={() => router.push("/checkout")}>Ver plano PRO</button>
        )}
        <button className="btn-secondary" onClick={() => router.push("/dashboard")}>Voltar ao painel</button>
      </div>
      {state.status === "denied" && <PaywallModal isOpen={modalOpen} reason={state.reason} onClose={closeModal} />}
    </div>
  );
}
