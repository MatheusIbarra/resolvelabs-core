"use client";

import { useEffect, useState } from "react";
import { supportApi, type Ticket, type TicketStatus, type TicketSummary } from "@/lib/supportApi";
import { usePolling } from "@/hooks/usePolling";
import TicketThread, { StatusTag } from "../support/TicketThread";
import { useI18n } from "@/i18n/I18nProvider";

import { Loading, LoadingLabel } from "../ui/Loading";

const LIST_POLL_MS = 15000;
const FILTERS = [
  { id: "all", labelKey: "filterAll" },
  { id: "open", labelKey: "filterOpen" },
  { id: "answered", labelKey: "filterAnswered" },
  { id: "closed", labelKey: "filterClosed" },
] as const;

export default function SupportAdmin() {
  const tr = useI18n();
  const { t } = tr;
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const load = async () => {
    try {
      setTickets((await supportApi.list(filter === "all" ? undefined : filter)).tickets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.supportAdmin.loadFailed"));
    }
  };

  // `filter` como resetKey: ao trocar o filtro, esvazia a lista e busca de novo.
  usePolling(load, LIST_POLL_MS, true, filter);
  useEffect(() => setTickets(null), [filter]);

  const syncSummary = (changed: Ticket) =>
    setTickets((list) => list?.map((s) => (s.id === changed.id ? { ...s, status: changed.status, updatedAt: changed.updatedAt, messageCount: changed.messageCount, lastSender: changed.lastSender, lastMessage: changed.lastMessage } : s)) ?? list);

  const closeTicket = async (id: string, onUpdate: (t: Ticket) => void) => {
    if (closing || !window.confirm(t("admin.supportAdmin.confirmClose"))) return;
    setClosing(true);
    try {
      const { ticket } = await supportApi.close(id);
      // O PATCH não devolve e-mail do autor; preserva o que já estava na tela.
      onUpdate({ ...ticket, userEmail: tickets?.find((s) => s.id === id)?.userEmail ?? null });
      syncSummary(ticket);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("admin.supportAdmin.closeFailed"));
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="card grid overflow-hidden lg:h-[calc(100vh-18rem)] lg:min-h-[32rem] lg:grid-cols-[22rem_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-stone-200 lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap border-b border-stone-200">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
                filter === f.id ? "bg-teal-50 text-teal-800" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {t(`admin.supportAdmin.${f.labelKey}`)}
            </button>
          ))}
        </div>

        <ul className="max-h-72 min-h-0 flex-1 overflow-y-auto lg:max-h-none">
          {error && (
            <li className="p-4 text-sm text-red-700" role="alert">
              {error}
            </li>
          )}
          {!error && tickets === null && <li className="p-4 text-sm text-stone-500"><Loading>{t("common.ui.loading")}</Loading></li>}
          {tickets?.length === 0 && <li className="p-4 text-sm text-stone-500">{t("admin.supportAdmin.none")}</li>}
          {tickets?.map((ticket) => {
            // "Aguardando admin": a última mensagem é do cliente e o ticket não foi fechado.
            const needsReply = ticket.status === "open";
            return (
              <li key={ticket.id} className="border-b border-stone-100">
                <button
                  onClick={() => setActiveId(ticket.id)}
                  aria-current={activeId === ticket.id}
                  className={`block w-full px-3 py-3 text-left transition-colors ${activeId === ticket.id ? "bg-teal-50" : "hover:bg-stone-50"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {needsReply && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title={t("admin.supportAdmin.awaiting")} />}
                      <span className="truncate text-sm font-medium text-stone-900">{ticket.subject}</span>
                    </span>
                    <StatusTag status={ticket.status} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-stone-500">{ticket.userEmail ?? "—"}</span>
                  <span className="mt-1 block text-xs text-stone-400">
                    {t("admin.supportAdmin.messages", { count: ticket.messageCount })} · {tr.dateTime(ticket.updatedAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="min-h-[28rem] min-w-0 lg:min-h-0">
        {activeId ? (
          <TicketThread
            ticketId={activeId}
            viewer="admin"
            onChange={syncSummary}
            actions={(ticket, onUpdate) =>
              ticket.status !== "closed" && (
                <button onClick={() => closeTicket(ticket.id, onUpdate)} disabled={closing} className="btn-secondary btn-sm shrink-0">
                  {closing ? <LoadingLabel>{t("admin.supportAdmin.closing")}</LoadingLabel> : t("admin.supportAdmin.close")}
                </button>
              )
            }
          />
        ) : (
          <p className="p-6 text-sm text-stone-500">{t("admin.supportAdmin.select")}</p>
        )}
      </section>
    </div>
  );
}
