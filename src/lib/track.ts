import type { TrackEvent, TrackKind } from "./trackEvents";

/** Envia um evento anônimo de uso. Falhas são ignoradas: métrica nunca atrapalha o usuário. */
export function trackEvent(tool: string, event: TrackEvent, kind?: TrackKind) {
  try {
    const body = JSON.stringify({ tool, event, kind });
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // sem rastreio
  }
}
