"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Registra a visita a cada troca de rota (usuário, IP e local são resolvidos no servidor). Falhas são ignoradas. */
export default function PageViewLogger() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const body = JSON.stringify({ path: pathname, referrer: document.referrer });
      if (navigator.sendBeacon?.("/api/activity", new Blob([body], { type: "application/json" }))) return;
      void fetch("/api/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    } catch {
      // sem registro
    }
  }, [pathname]);
  return null;
}
