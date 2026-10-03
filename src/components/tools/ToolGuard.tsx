"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { t } = useI18n();
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
        if (!ignore) setState({ status: "error", message: err instanceof Error ? err.message : t("common.toolGuard.validateFailed") });
      });
    return () => {
      ignore = true;
    };
  }, [slug, attempt, t]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  if (state.status === "validating") return <LoadingScreen label={t("common.toolGuard.verifying")} />;
  if (state.status === "allowed") return <>{children}</>;

  return (
    <div className="card p-10 text-center">
      <p className="mb-2 text-lg font-semibold text-stone-900">
        {state.status === "error" ? t("common.toolGuard.errorTitle") : t("common.toolGuard.restrictedTitle")}
      </p>
      <p className="mb-6 text-sm text-stone-600">
        {state.status === "error" ? state.message : t("common.toolGuard.restrictedBody")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {state.status === "error" ? (
          <button className="btn-primary" onClick={() => setAttempt((n) => n + 1)}>{t("common.ui.tryAgain")}</button>
        ) : (
          <button className="btn-primary" onClick={() => router.push("/checkout")}>{t("common.toolGuard.viewPro")}</button>
        )}
        <button className="btn-secondary" onClick={() => router.push("/dashboard")}>{t("common.toolGuard.backToDashboard")}</button>
      </div>
      {state.status === "denied" && <PaywallModal isOpen={modalOpen} reason={state.reason} onClose={closeModal} />}
    </div>
  );
}
