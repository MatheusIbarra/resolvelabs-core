import { useEffect, useRef } from "react";

/**
 * Executa `task` ao ativar, a cada `intervalMs` e sempre que a aba volta a ficar visível/focada.
 * Pausa enquanto a aba está em segundo plano, então não gera requisições à toa.

 * Mudar `resetKey` reinicia o ciclo e busca imediatamente.
 * Erros são responsabilidade do `task` (ele deve tratá-los).
 */
export function usePolling(task: () => void | Promise<void>, intervalMs: number, enabled = true, resetKey?: unknown) {
  const taskRef = useRef(task);
  taskRef.current = task;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;

    const run = () => void taskRef.current();
    const start = () => {
      stop();
      timer = setInterval(run, intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        run();
        start();
      } else {
        stop();
      }
    };

    run();
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [intervalMs, enabled, resetKey]);
}
