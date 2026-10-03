"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { checkToolAccess } from "@/lib/fakeApi";
import { TOOLS, toolCopy, type Tool } from "@/lib/tools";
import type { DenyReason } from "@/lib/content";
import PaywallModal from "../PaywallModal";
import { LoadingLabel } from "../ui/Loading";
import { useToast } from "../ui/Toast";
import { startRouteProgress } from "../ui/RouteProgress";
import { errorMessage } from "@/lib/messages";

export default function ToolsGrid() {
  const router = useRouter();
  const toast = useToast();
  const { t, raw } = useI18n();
  const items = raw("common.tools.items");
  const { profile } = useAuth();
  const [validatingSlug, setValidatingSlug] = useState<string | null>(null);
  const [denied, setDenied] = useState<DenyReason | null>(null);

  const openTool = async (tool: Tool) => {
    if (validatingSlug) return;
    setValidatingSlug(tool.slug);
    try {
      const access = await checkToolAccess(tool.slug);
      if (access.allowed) {
        startRouteProgress();
        router.push(tool.href);
      }
      else setDenied(access.reason);
    } catch (err) {
      toast.error(errorMessage(err, t("msg.tools.validateFailed")));
    } finally {
      setValidatingSlug(null);
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">{t("dashboard.toolsGrid.title")}</h2>
      </div>

      <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((tool) => {
          const live = tool.status === "live";
          const locked = live && tool.requiresPro && profile?.plan !== "PRO";
          const validating = validatingSlug === tool.slug;
          const copy = toolCopy(items, tool.slug);

          return (
            <article
              key={tool.slug}
              className={`card flex flex-col p-6 ${
                live ? "card-interactive hover:border-teal-600" : "border-stone-200 bg-stone-100"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    live ? "bg-teal-50 text-teal-700" : "bg-stone-200 text-stone-500"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={tool.iconPath} />
                  </svg>
                </span>
                {!live ? (
                  <span className="badge-warn">{t("dashboard.toolsGrid.soon")}</span>
                ) : tool.requiresPro ? (
                  <span className="badge-brand">{t("dashboard.toolsGrid.pro")}</span>
                ) : (
                  <span className="badge-neutral">{t("dashboard.toolsGrid.free")}</span>
                )}
              </div>

              <h3 className={`mb-1 text-base font-semibold ${live ? "text-stone-900" : "text-stone-600"}`}>{copy.name}</h3>
              <p className={`mb-6 flex-1 text-sm ${live ? "text-stone-600" : "text-stone-500"}`}>{copy.description}</p>

              {live ? (
                <button onClick={() => openTool(tool)} disabled={validatingSlug !== null} className={locked ? "btn-secondary" : "btn-primary"}>
                  {validating ? <LoadingLabel>{t("dashboard.toolsGrid.verifying")}</LoadingLabel> : locked ? t("dashboard.toolsGrid.proOnly") : t("dashboard.toolsGrid.open")}
                </button>
              ) : (
                <button disabled className="btn-secondary">{t("dashboard.toolsGrid.availableSoon")}</button>
              )}
            </article>
          );
        })}
      </div>

      <PaywallModal isOpen={denied !== null} reason={denied ?? "PRO_REQUIRED"} onClose={() => setDenied(null)} />
    </section>
  );
}
