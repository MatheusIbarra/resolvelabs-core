"use client";

import { useEffect, useRef, useState } from "react";
import { supportApi, type Ticket } from "@/lib/supportApi";
import { useI18n } from "@/i18n/I18nProvider";
import { usePolling } from "@/hooks/usePolling";

import { Loading, LoadingLabel } from "../ui/Loading";

const POLL_MS = 8000;
const MESSAGE_MAX = 4000;

export const STATUS_STYLE: Record<Ticket["status"], string> = {
  open: "bg-amber-50 text-amber-800",
  answered: "bg-teal-50 text-teal-800",
  closed: "bg-stone-100 text-stone-500",
};

export function StatusTag({ status }: { status: Ticket["status"] }) {
  const { t } = useI18n();
  return <span className={`badge ${STATUS_STYLE[status]}`}>{t(`support.status.${status}`)}</span>;
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
  const tr = useI18n();
  const { t } = tr;
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
      setLoadError(err instanceof Error ? err.message : t("support.thread.loadFailed"));
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
      setSendError(err instanceof Error ? err.message : t("support.thread.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  if (!ticket) {
    return (
      <p className="p-4 text-sm text-stone-500" role={loadError ? "alert" : "status"}>
        {loadError ?? <Loading>{t("common.ui.loading")}</Loading>}
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
                {m.sender === "admin" ? t("support.thread.senderSupport") : t("support.thread.senderUser")} · {tr.dateTime(m.createdAt)}
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
          {t("support.thread.offline")}
        </p>
      )}

      {closed ? (
        <p className="border-t border-stone-200 p-3 text-sm text-stone-500">{t("support.thread.closedNote")}</p>
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
            placeholder={viewer === "admin" ? t("support.thread.placeholderAdmin") : t("support.thread.placeholderUser")}
            aria-label={t("support.thread.messageAria")}
            className="input resize-none"
          />
          {sendError && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {sendError}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-stone-400">{t("support.thread.ctrlEnter")}</span>
            <button type="submit" disabled={sending || draft.trim().length === 0} className="btn-primary">
              {sending ? <LoadingLabel>{t("support.widget.sending")}</LoadingLabel> : t("support.thread.send")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
