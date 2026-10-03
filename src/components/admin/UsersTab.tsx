"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";
import GrantProModal from "./GrantProModal";

function RoleCell({ user }: { user: AdminUser }) {
  const { t } = useI18n();
  const expired = user.role === "pro" && user.planExpiresAt !== null && new Date(user.planExpiresAt) < new Date();
  if (user.role === "admin") return <span className="badge border border-teal-700 bg-white text-teal-800">{t("admin.users.roleAdmin")}</span>;
  if (user.role === "pro") return <span className={expired ? "badge-warn" : "badge-brand"}>PRO{expired ? ` · ${t("admin.users.expired")}` : ""}</span>;
  return <span className="badge-neutral">FREE</span>;
}

export default function UsersTab() {
  const toast = useToast();
  const tr = useI18n();
  const { t } = tr;
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
      setError(errorMessage(err, t("msg.admin.loadFailed")));
    }
  }, [t]);

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
      toast.error(errorMessage(err, t("msg.admin.actionFailed")));
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!users) return <Loading>{t("admin.users.loading")}</Loading>;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          aria-label={t("admin.users.searchAria")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.users.searchPlaceholder")}
          className="input max-w-sm"
        />
        <span className="text-sm text-stone-500">{t("admin.users.count", { shown: filtered.length, total: users.length })}</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="table-th">{t("admin.users.email")}</th>
              <th className="table-th">{t("admin.users.plan")}</th>
              <th className="table-th">{t("admin.users.expires")}</th>
              <th className="table-th">{t("admin.users.usage")}</th>
              <th className="table-th">{t("admin.users.code")}</th>
              <th className="table-th">{t("admin.users.referredBy")}</th>
              <th className="table-th">{t("admin.users.signup")}</th>
              <th className="table-th text-right">{t("admin.users.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="table-td py-10 text-center text-stone-500">{t("admin.users.empty")}</td></tr>
            )}
            {filtered.map((u) => {
              const isAdmin = u.role === "admin";
              return (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="table-td font-medium text-stone-900">{u.email}</td>
                  <td className="table-td"><RoleCell user={u} /></td>
                  <td className="table-td">{u.role === "pro" ? (u.planExpiresAt ? tr.date(u.planExpiresAt) : "∞") : "—"}</td>
                  <td className="table-td">{u.usageCount}</td>
                  <td className="table-td">{u.affiliateCode ?? "—"}</td>
                  <td className="table-td">{u.referredBy ?? "—"}</td>
                  <td className="table-td">{tr.date(u.createdAt)}</td>
                  <td className="table-td text-right">
                    {isAdmin ? (
                      <span className="text-stone-400">—</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button disabled={busyId === u.id} onClick={() => setGrantTarget(u)} className="btn-secondary btn-sm">{t("admin.users.grant")}</button>
                        {u.role === "pro" && (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => act(u, () => adminApi.revokePro(u.id), t("msg.admin.revoked", { email: u.email }))}
                            className="btn-secondary btn-sm"
                          >
                            {t("admin.users.revoke")}
                          </button>
                        )}
                        <button
                          disabled={busyId === u.id || u.usageCount === 0}
                          onClick={() => act(u, () => adminApi.resetUsage(u.id), t("msg.admin.usageReset", { email: u.email }))}
                          className="btn-secondary btn-sm"
                        >
                          {t("admin.users.resetUsage")}
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
