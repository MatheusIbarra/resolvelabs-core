"use client";

import { fmtDate } from "@/lib/format";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { ADMIN_MSG, errorMessage } from "@/lib/messages";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";
import GrantProModal from "./GrantProModal";

function RoleCell({ user }: { user: AdminUser }) {
  const expired = user.role === "pro" && user.planExpiresAt !== null && new Date(user.planExpiresAt) < new Date();
  if (user.role === "admin") return <span className="badge border border-teal-700 bg-white text-teal-800">Admin</span>;
  if (user.role === "pro") return <span className={expired ? "badge-warn" : "badge-brand"}>PRO{expired ? " · vencido" : ""}</span>;
  return <span className="badge-neutral">FREE</span>;
}

export default function UsersTab() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [grantTarget, setGrantTarget] = useState<AdminUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setUsers((await adminApi.listUsers()).users);
    } catch (err) {
      setError(errorMessage(err, ADMIN_MSG.loadFailed));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter((u) => !q || u.email.includes(q) || u.affiliateCode?.toLowerCase().includes(q));
  }, [users, query]);

  const act = async (user: AdminUser, run: () => Promise<unknown>, success: string) => {
    setBusyId(user.id);
    try {
      await run();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, ADMIN_MSG.actionFailed));
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!users) return <Loading>Carregando usuários…</Loading>;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          aria-label="Buscar usuário"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por e-mail ou código…"
          className="input max-w-sm"
        />
        <span className="text-sm text-stone-500">{filtered.length} de {users.length} usuários</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="table-th">E-mail</th>
              <th className="table-th">Plano</th>
              <th className="table-th">Expira em</th>
              <th className="table-th">Uso</th>
              <th className="table-th">Código</th>
              <th className="table-th">Indicado por</th>
              <th className="table-th">Cadastro</th>
              <th className="table-th text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="table-td py-10 text-center text-stone-500">Nenhum usuário encontrado</td></tr>
            )}
            {filtered.map((u) => {
              const isAdmin = u.role === "admin";
              return (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="table-td font-medium text-stone-900">{u.email}</td>
                  <td className="table-td"><RoleCell user={u} /></td>
                  <td className="table-td">{u.role === "pro" ? (u.planExpiresAt ? fmtDate(u.planExpiresAt) : "∞") : "—"}</td>
                  <td className="table-td">{u.usageCount}</td>
                  <td className="table-td">{u.affiliateCode ?? "—"}</td>
                  <td className="table-td">{u.referredBy ?? "—"}</td>
                  <td className="table-td">{fmtDate(u.createdAt)}</td>
                  <td className="table-td text-right">
                    {isAdmin ? (
                      <span className="text-stone-400">—</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button disabled={busyId === u.id} onClick={() => setGrantTarget(u)} className="btn-secondary btn-sm">Conceder PRO</button>
                        {u.role === "pro" && (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => act(u, () => adminApi.revokePro(u.id), ADMIN_MSG.revoked(u.email))}
                            className="btn-secondary btn-sm"
                          >
                            Revogar
                          </button>
                        )}
                        <button
                          disabled={busyId === u.id || u.usageCount === 0}
                          onClick={() => act(u, () => adminApi.resetUsage(u.id), ADMIN_MSG.usageReset(u.email))}
                          className="btn-secondary btn-sm"
                        >
                          Zerar uso
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <GrantProModal user={grantTarget} onClose={() => setGrantTarget(null)} onGranted={load} />
    </section>
  );
}
