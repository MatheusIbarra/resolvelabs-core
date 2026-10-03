"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import type { DenyReason } from "@/lib/content";
import PaywallModal from "@/components/PaywallModal";

interface PaywallValue {
  isOpen: boolean;
  reason: DenyReason;
  open: (reason: DenyReason) => void;
  close: () => void;
}

const PaywallContext = createContext<PaywallValue | null>(null);

/** Estado global do paywall + o próprio modal. Basta envolver o app (uma vez, em app/layout.tsx). */
export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<{ isOpen: boolean; reason: DenyReason }>({ isOpen: false, reason: "AUTH_REQUIRED" });

  const open = useCallback((reason: DenyReason) => setState({ isOpen: true, reason }), []);
  const close = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);

  // O modal é global: ao navegar (ex.: "Criar conta"), ele não pode seguir o usuário para a próxima página.
  useEffect(() => {
    close();
  }, [pathname, close]);

  const value = useMemo(() => ({ ...state, open, close }), [state, open, close]);

  return (
    <PaywallContext.Provider value={value}>
      {children}
      <PaywallModal isOpen={state.isOpen} reason={state.reason} onClose={close} />
    </PaywallContext.Provider>
  );
}

export function usePaywall(): PaywallValue {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error("usePaywall deve ser usado dentro de <PaywallProvider>");
  return ctx;
}
