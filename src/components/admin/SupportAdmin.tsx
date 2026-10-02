"use client";

import { useEffect, useState } from "react";
import { supportApi, type Ticket, type TicketStatus, type TicketSummary } from "@/lib/supportApi";
import { usePolling } from "@/hooks/usePolling";
import TicketThread, { StatusTag } from "../support/TicketThread";
import { BTN, MONO } from "./adminUi";

import { Loading, LoadingLabel } from "../ui/Loading";

const LIST_POLL_MS = 15000;
const FILTERS: { id: TicketStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Abertos" },
  { id: "answered", label: "Respondidos" },
  { id: "closed", label: "Fechados" },
];

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function SupportAdmin() {
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
      setError(err instanceof Error ? err.message : "Falha ao carregar os tickets.");
    }
  };

  // `filter` como resetKey: ao trocar o filtro, esvazia a lista e busca de novo.
  usePolling(load, LIST_POLL_MS, true, filter);
  useEffect(() => setTickets(null), [filter]);

  const syncSummary = (t: Ticket) =>
    setTickets((list) => list?.map((s) => (s.id === t.id ? { ...s, status: t.status, updatedAt: t.updatedAt, messageCount: t.messageCount, lastSender: t.lastSender, lastMessage: t.lastMessage } : s)) ?? list);

  const closeTicket = async (id: string, onUpdate: (t: Ticket) => void) => {
    if (closing || !window.confirm("Fechar este ticket? O cliente não poderá mais responder nele.")) return;
    setClosing(true);
    try {
      const { ticket } = await supportApi.close(id);
      // O PATCH não devolve e-mail do autor; preserva o que já estava na tela.
      onUpdate({ ...ticket, userEmail: tickets?.find((s) => s.id === id)?.userEmail ?? null });
      syncSummary(ticket);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Falha ao fechar o ticket.");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="card grid overflow-hidden lg:h-[calc(100vh-18rem)] lg:min-h-[32rem] lg:grid-cols-[22rem_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-stone-200 lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap border-b border-stone-200">
          {FILTERS.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
                filter === f.id ? "bg-teal-50 text-teal-800" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ul className="max-h-72 min-h-0 flex-1 overflow-y-auto lg:max-h-none">
          {error && (
            <li className="p-4 text-sm text-red-700" role="alert">
              {error}
            </li>
          )}
          {!error && tickets === null && <li className="p-4 text-sm text-stone-500"><Loading>Carregando…</Loading></li>}
          {tickets?.length === 0 && <li className="p-4 text-sm text-stone-500">Nenhum ticket.</li>}
          {tickets?.map((t) => {
            // "Aguardando admin": a última mensagem é do cliente e o ticket não foi fechado.
            const needsReply = t.status === "open";
            return (
              <li key={t.id} className="border-b border-stone-100">
                <button
                  onClick={() => setActiveId(t.id)}
                  aria-current={activeId === t.id}
                  className={`block w-full px-3 py-3 text-left transition-colors ${activeId === t.id ? "bg-teal-50" : "hover:bg-stone-50"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {needsReply && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Aguardando resposta" />}
                      <span className="truncate text-sm font-medium text-stone-900">{t.subject}</span>
                    </span>
                    <StatusTag status={t.status} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-stone-500">{t.userEmail ?? "—"}</span>
                  <span className="mt-1 block text-xs text-stone-400">
                    {t.messageCount} msg · {fmtTime(t.updatedAt)}
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
                <button onClick={() => closeTicket(ticket.id, onUpdate)} disabled={closing} className={`${BTN} shrink-0`}>
                  {closing ? <LoadingLabel>Fechando…</LoadingLabel> : "Fechar"}
                </button>
              )
            }
          />
        ) : (
          <p className="p-6 text-sm text-stone-500">Selecione um ticket para ver a conversa.</p>
        )}
      </section>
    </div>
  );
}
