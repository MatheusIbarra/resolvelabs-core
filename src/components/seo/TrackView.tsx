"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/track";

/** Conta uma visita à página da ferramenta (uma vez por montagem). */
export default function TrackView({ tool }: { tool: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent(tool, "view");
  }, [tool]);
  return null;
}
