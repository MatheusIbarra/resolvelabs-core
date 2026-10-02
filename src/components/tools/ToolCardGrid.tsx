import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export default function ToolCardGrid() {
  return (
    <div className="stagger grid gap-4 sm:grid-cols-2">
      {TOOLS.map((tool) => (
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
            <span className={tool.requiresPro ? "badge-brand" : "badge-neutral"}>{tool.requiresPro ? "PRO" : "Grátis"}</span>
          </div>
          <p className="mb-1 text-xs text-stone-500">{tool.audience}</p>
          <h2 className="mb-1 text-lg font-semibold text-stone-900">{tool.name}</h2>
          <p className="mb-4 flex-1 text-sm text-stone-600">{tool.description}</p>
          <span className="text-sm font-medium text-teal-700 group-hover:underline">Abrir ferramenta →</span>
        </Link>
      ))}
    </div>
  );
}
