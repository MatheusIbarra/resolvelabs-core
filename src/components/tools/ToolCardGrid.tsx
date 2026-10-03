"use client";

import { Link } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { TOOLS, toolCopy } from "@/lib/tools";

export default function ToolCardGrid() {
  const { t, raw } = useI18n();
  const items = raw("common.tools.items");
  return (
    <div className="stagger grid gap-4 sm:grid-cols-2">
      {TOOLS.map((tool) => {
        const copy = toolCopy(items, tool.slug);
        return (
          <Link
            key={tool.slug}
            href={tool.href}
            className="card card-interactive group flex flex-col p-6 hover:border-teal-600"
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={tool.iconPath} />
                </svg>
              </span>
              <span className={tool.requiresPro ? "badge-brand" : "badge-neutral"}>
                {tool.requiresPro ? t("common.tools.badgePro") : t("common.tools.badgeFree")}
              </span>
            </div>
            <p className="mb-1 text-xs text-stone-500">{copy.audience}</p>
            <h2 className="mb-1 text-lg font-semibold text-stone-900">{copy.name}</h2>
            <p className="mb-4 flex-1 text-sm text-stone-600">{copy.description}</p>
            <span className="text-sm font-medium text-teal-700 group-hover:underline">{t("common.tools.openTool")}</span>
          </Link>
        );
      })}
    </div>
  );
}
