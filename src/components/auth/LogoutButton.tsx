"use client";

import { useState } from "react";
import { useToast } from "../ui/Toast";
import { LoadingLabel } from "../ui/Loading";
import { AUTH_MSG } from "@/lib/messages";

export default function LogoutButton({ className }: { className?: string }) {
  const toast = useToast();
  const [isPending, setIsPending] = useState(false);

  const logout = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.assign("/login");
    } catch {
      toast.error(AUTH_MSG.logoutFailed);
      setIsPending(false);
    }
  };

  return (
    <button onClick={logout} disabled={isPending} className={className}>
      {isPending ? <LoadingLabel>Saindo…</LoadingLabel> : "Sair"}
    </button>
  );
}
