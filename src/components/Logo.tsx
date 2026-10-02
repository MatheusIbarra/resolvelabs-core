import { useId } from "react";

// Frasco de laboratório: mesma geometria dos arquivos em /public/brand (viewBox 64).
const FLASK = "M26.5 14 H37.5 V27.5 L50.2 47.8 C52.6 51.7 49.9 56 45.3 56 H18.7 C14.1 56 11.4 51.7 13.8 47.8 L26.5 27.5 Z";
const WAVE = "M0 41.5 C6 37.5 11 37.5 16 41 S26 44.5 32 41 S43 37.5 48 41 S58 44.5 64 41 V64 H0 Z";

/** Símbolo do ResolveLabs (frasco com líquido sobre fundo verde-azulado). */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  const clip = `flask-${useId().replace(/[^a-zA-Z0-9]/g, "")}`; // id único: o logo aparece mais de uma vez na página
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <path d={FLASK} />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0f766e" />
      <path d={FLASK} fill="#fff" />
      <rect x="23" y="9" width="18" height="6" rx="3" fill="#fff" />
      <g clipPath={`url(#${clip})`}>
        <path d={WAVE} fill="#14b8a6" />
        <circle cx="27" cy="49" r="2.3" fill="#fff" opacity=".9" />
        <circle cx="36.5" cy="46.5" r="1.7" fill="#fff" opacity=".9" />
        <circle cx="33" cy="52" r="1.2" fill="#fff" opacity=".9" />
      </g>
    </svg>
  );
}

/** Símbolo + nome. `tone="dark"` é para fundos escuros. */
export default function Logo({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={28} />
      <span className={`text-lg font-bold tracking-tight ${dark ? "text-stone-50" : "text-stone-900"}`}>
        Resolve<span className={dark ? "text-teal-300" : "text-teal-700"}>Labs</span>
      </span>
    </span>
  );
}
