"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { ADMIN_MSG, errorMessage } from "@/lib/messages";
import { useToast } from "../ui/Toast";
import { LoadingLabel } from "../ui/Loading";
import { BTN, BTN_SOLID, FIELD, MONO } from "./adminUi";

const PRESETS = [7, 30, 90, 365];

interface GrantProModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onGranted: () => void;
}

export default function GrantProModal({ user, onClose, onGranted }: GrantProModalProps) {
  const toast = useToast();
  const [days, setDays] = useState("30");
  const [lifetime, setLifetime] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reinicia o formulário só quando o alvo muda (não a cada render do pai).
  useEffect(() => {
    setDays("30");
    setLifetime(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = lifetime ? null : Number(days);
    if (value !== null && !(Number.isInteger(value) && value >= 1 && value <= 3650)) {
      toast.error(ADMIN_MSG.invalidDays);
      return;
    }
    setIsPending(true);
    try {
      await adminApi.grantPro(user.id, value);
      toast.success(ADMIN_MSG.granted(user.email, value), { title: ADMIN_MSG.grantedTitle });
      onGranted();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, ADMIN_MSG.grantFailed));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="grant-title"
        className="w-full max-w-md border-2 border-stone-950 bg-white"
      >
        <div className={`${MONO} flex items-center justify-between bg-stone-950 px-4 py-3 text-white`}>
          <span id="grant-title">Conceder PRO</span>
          <button type="button" onClick={onClose} aria-label="Fechar" className="hover:text-teal-300">ESC ✕</button>
        </div>

        <div className="space-y-5 p-5">
          <p className="font-mono text-sm break-all">{user.email}</p>

          <div>
            <label htmlFor="grant-days" className={`${MONO} mb-2 block text-stone-500`}>Dias de acesso</label>
            <input
              id="grant-days"
              type="number"
              min={1}
              max={3650}
              value={days}
              disabled={lifetime}
              onChange={(e) => setDays(e.target.value)}
              className={`${FIELD} disabled:bg-stone-100 disabled:text-stone-400`}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p} type="button" disabled={lifetime} onClick={() => setDays(String(p))} className={BTN}>
                  {p}d
                </button>
              ))}
            </div>
          </div>

          <label className={`${MONO} flex cursor-pointer items-center gap-3`}>
            <input type="checkbox" checked={lifetime} onChange={(e) => setLifetime(e.target.checked)} className="h-4 w-4 accent-stone-950" />
            Vitalício (sem expiração)
          </label>

          <p className="font-mono text-xs text-stone-500">
            Se o usuário já tem PRO ativo com data de vencimento, os dias são somados a partir dela.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-950 p-4">
          <button type="button" onClick={onClose} className={BTN}>Cancelar</button>
          <button type="submit" disabled={isPending} className={BTN_SOLID}>
            {isPending ? <LoadingLabel>Concedendo PRO…</LoadingLabel> : "Conceder PRO"}
          </button>
        </div>
      </form>
    </div>
  );
}
