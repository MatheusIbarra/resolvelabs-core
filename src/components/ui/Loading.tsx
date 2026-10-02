/** Anel giratório discreto (herda a cor do texto). Respeita "reduzir movimento" do sistema. */
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0 motion-safe:animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Carregamento em linha (listas, painéis, cartões): spinner + texto normal. */
export function Loading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const color = /\btext-[a-z]+-\d{2,3}\b/.test(className) ? "" : "text-stone-600";
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-2 font-sans text-sm normal-case tracking-normal ${color} ${className}`}>
      <Spinner />
      <span>{children}</span>
    </span>
  );
}

/** Texto de botão ocupado: herda tipografia e cor do botão. */
export function LoadingLabel({ children }: { children: React.ReactNode }) {
  return (
    <span role="status" className="inline-flex items-center justify-center gap-2">
      <Spinner />
      <span>{children}</span>
    </span>
  );
}

/** Carregamento de página/seção inteira. */
export function LoadingScreen({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loading className="text-base">{label}</Loading>
    </div>
  );
}
