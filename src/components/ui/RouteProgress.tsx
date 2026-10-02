"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "idle" | "loading" | "done";

/** Dá o tempo mínimo de a barra ser percebida mesmo em navegações instantâneas. */
const MIN_VISIBLE_MS = 250;
/** Se a rota nunca confirmar a troca (erro, mesma URL), a barra some sozinha. */
const GIVE_UP_MS = 10000;

const START_EVENT = "route-progress:start";

/** Inicia a barra manualmente — use antes de `router.push(...)`, que não passa por clique em <a>. */
export function startRouteProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

/** Link interno "comum": clique esquerdo sem modificadores, mesma aba, outra rota. */
function internalNavigationTarget(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const anchor = (e.target as Element | null)?.closest?.("a");
  if (!anchor || !anchor.href) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return url;
}

/** Barra fina no topo da tela que acompanha as trocas de página (estilo NProgress, sem dependências). */
export default function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const start = () => {
      clearTimers();
      startedAt.current = Date.now();
      setPhase("loading");
      timers.current.push(setTimeout(() => setPhase("idle"), GIVE_UP_MS));
    };
    const onClick = (e: MouseEvent) => {
      // O Link do Next faz preventDefault no próprio handler, então olhamos na fase de captura.
      if (internalNavigationTarget(e)) start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(START_EVENT, start);
      clearTimers();
    };
  }, []);

  // A troca de rota confirmou: completa a barra e esconde.
  useEffect(() => {
    if (startedAt.current === 0) return;
    clearTimers();
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt.current));
    timers.current.push(
      setTimeout(() => {
        setPhase("done");
        timers.current.push(setTimeout(() => setPhase("idle"), 400));
      }, wait),
    );
    startedAt.current = 0;
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]"
      style={{ opacity: phase === "idle" ? 0 : 1, transition: "opacity 300ms ease 100ms" }}
    >
      <div
        className="h-full origin-left bg-teal-600 shadow-[0_0_8px_theme(colors.teal.500)]"
        style={{
          width: phase === "idle" ? "0%" : phase === "done" ? "100%" : "85%",
          transition:
            phase === "loading"
              ? "width 8s cubic-bezier(0.1, 0.6, 0.2, 1)"
              : phase === "done"
                ? "width 200ms ease-out"
                : "none",
        }}
      />
    </div>
  );
}
