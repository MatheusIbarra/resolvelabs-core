"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, type UserProfile } from "@/lib/fakeApi";
import { MSG, errorMessage } from "@/lib/messages";
import { useToast } from "@/components/ui/Toast";

interface AuthValue {
  profile: UserProfile | null;
  /** Carregando o perfil (montagem ou refresh não silencioso). */
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Atualiza o perfil local com dados já devolvidos por outra chamada da API. */
  applyProfile: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProfile(await getProfile());
    } catch (err) {
      const message = errorMessage(err, MSG.auth.profileFailed);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const applyProfile = useCallback(
    (patch: Partial<UserProfile>) => setProfile((p) => (p ? { ...p, ...patch } : p)),
    [],
  );

  const value = useMemo(
    () => ({ profile, isLoading, error, refresh, applyProfile }),
    [profile, isLoading, error, refresh, applyProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
