"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

/** "Entrar" para visitantes, "Meu painel" para quem já tem sessão. */
export default function HeaderAuthLink() {
  const { profile, isLoading } = useAuth();
  const loggedIn = profile?.isAuthenticated === true;
  return (
    <Link
      href={loggedIn ? "/dashboard" : "/login"}
      className={`hidden text-sm font-medium text-stone-600 hover:text-stone-900 sm:block ${isLoading ? "invisible" : ""}`}
    >
      {loggedIn ? "Meu painel" : "Entrar"}
    </Link>
  );
}
