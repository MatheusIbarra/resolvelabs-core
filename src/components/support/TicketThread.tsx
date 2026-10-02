"use client";

import { useEffect, useRef, useState } from "react";
import { supportApi, STATUS_LABEL, type Ticket } from "@/lib/supportApi";
import { usePolling } from "@/hooks/usePolling";

import { Loading, LoadingLabel } from "../ui/Loading";

const POLL_MS = 8000;
const MESSAGE_MAX = 4000;

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const STATUS_STYLE: Record<Ticket["status"], string> = {
  open: "bg-amber-50 text-amber-800",
  answered: "bg-teal-50 text-teal-800",
  closed: "bg-stone-100 text-stone-500",
};

export function StatusTag({ status }: { status: Ticket["status"] }) {
  return <span className={`badge ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

interface TicketThreadProps {
  ticketId: string;
  /** Quem está olhando: define quais mensagens ficam à direita ("minhas"). */
  viewer: "user" | "admin";
  /** Ações extras no cabeçalho (ex.: botão de fechar para admin). */
  actions?: (ticket: Ticket, onUpdate: (t: Ticket) => void) => React.ReactNode;
  /** Avisa o pai quando o ticket muda (para atualizar listas/indicadores). */
  onChange?: (ticket: Ticket) => void;
}

/** Histórico + caixa de resposta. Atualiza por polling (a cada 8s, ao focar a aba) — sem WebSockets. */
export default function TicketThread({ ticketId, viewer, actions, onChange }: TicketThreadProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // Ao trocar de ticket, limpa o estado anterior.
  useEffect(() => {
    setTicket(null);
    setLoadError(null);
    setDraft("");
    setSendError(null);
    lastCount.current = 0;
  }, [ticketId]);

  const apply = (next: Ticket) => {
    setTicket(next);
    onChange?.(next);
  };

  usePolling(async () => {
    try {
      const { ticket: fresh } = await supportApi.get(ticketId);
      setLoadError(null);
      setTicket((current) => {
        // Evita re-render (e perda de scroll) quando nada mudou.
        if (current && current.id === fresh.id && current.updatedAt === fresh.updatedAt && current.status === fresh.status) return current;
        onChange?.(fresh);
        return fresh;
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Falha ao carregar o ticket.");
    }
  }, POLL_MS);

  // Rola para o fim só quando chegam mensagens novas.
  useEffect(() => {
    const count = ticket?.messages.length ?? 0;
    if (count !== lastCount.current) {
      lastCount.current = count;
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [ticket]);

  const send = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const { ticket: updated } = await supportApi.reply(ticketId, message);
      apply(updated);
      setDraft("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Falha ao enviar.");
    } finally {
      setSending(false);
    }
  };

  if (!ticket) {
    return (
      <p className="p-4 text-sm text-stone-500" role={loadError ? "alert" : "status"}>
        {loadError ?? <Loading>Carregando…</Loading>}
      </p>
    );
  }

  const closed = ticket.status === "closed";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-stone-200 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900" title={ticket.subject}>
            {ticket.subject}
          </p>
          <p className="text-xs font-medium mt-1 flex flex-wrap items-center gap-2 text-stone-500">
            <StatusTag status={ticket.status} />
            <span>#{ticket.id.slice(-6)}</span>
            {ticket.userEmail && <span className="normal-case tracking-normal">{ticket.userEmail}</span>}
          </p>
        </div>
        {actions?.(ticket, apply)}
      </div>

      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-stone-50 p-3" aria-live="polite">
        {ticket.messages.map((m) => {
          const mine = m.sender === viewer;
          return (
            <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="mb-1 text-xs text-stone-500">
                {m.sender === "admin" ? "Suporte" : "Usuário"} · {fmtTime(m.createdAt)}
              </span>
              <p
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-teal-700 text-white" : "border border-stone-200 bg-white text-stone-900"
                }`}
              >
                {m.message}
              </p>
            </li>
          );
        })}
        <div ref={bottomRef} />
      </ol>

      {loadError && (
        <p className="border-t border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900" role="alert">
          Sem conexão — tentando de novo…
        </p>
      )}

      {closed ? (
        <p className="border-t border-stone-200 p-3 text-sm text-stone-500">Ticket fechado. Abra um novo se precisar de ajuda.</p>
      ) : (
        <form
          className="border-t border-stone-200 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void send();
              }
            }}
            maxLength={MESSAGE_MAX}
            rows={3}
            placeholder={viewer === "admin" ? "Responder ao cliente…" : "Escreva sua mensagem…"}
            aria-label="Mensagem"
            className="input resize-none"
          />
          {sendError && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {sendError}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-stone-400">Ctrl+Enter envia</span>
            <button type="submit" disabled={sending || draft.trim().length === 0} className="btn-primary">
              {sending ? <LoadingLabel>Enviando…</LoadingLabel> : "Enviar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
