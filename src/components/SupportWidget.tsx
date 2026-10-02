"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePolling } from "@/hooks/usePolling";
import { filterFaq } from "@/lib/supportFaq";
import { supportApi, type TicketSummary } from "@/lib/supportApi";
import { BTN, BTN_SOLID, FIELD, MONO } from "./admin/adminUi";
import TicketThread, { StatusTag } from "./support/TicketThread";

type View = "faq" | "tickets" | "new" | "chat";

import { Loading, LoadingLabel } from "./ui/Loading";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 4000;
const LIST_POLL_OPEN_MS = 15000;
const LIST_POLL_CLOSED_MS = 60000;

const TITLES: Record<View, string> = { faq: "SUPORTE", tickets: "MEUS TICKETS", new: "NOVO TICKET", chat: "CONVERSA" };

/** Widget flutuante de suporte: FAQ pesquisável, abertura de ticket e chat por polling. */
export default function SupportWidget() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const loggedIn = profile?.isAuthenticated === true;
  const isAdmin = profile?.role === "admin";

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("faq");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);

  // Lista de tickets: mais frequente com o widget aberto, e lenta (só p/ o indicador) quando fechado.
  usePolling(
    async () => {
      try {
        setTickets((await supportApi.list()).tickets);
      } catch {
        // silencioso: o indicador apenas não atualiza
      }
    },
    open ? LIST_POLL_OPEN_MS : LIST_POLL_CLOSED_MS,
    loggedIn && !isAdmin,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hasAnswered = tickets?.some((t) => t.status === "answered") ?? false;

  // Admins respondem pelo painel (/admin/support).
  if (isAdmin) return null;

  const goSupport = () => {
    if (!loggedIn) return setView("tickets"); // mostra o aviso de autenticação
    setView(tickets && tickets.length > 0 ? "tickets" : "new");
  };

  const openChat = (id: string) => {
    setActiveId(id);
    setView("chat");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          role="dialog"
          aria-label="Suporte"
          className="flex h-[min(34rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] animate-[scale-in_0.25s_cubic-bezier(0.22,1,0.36,1)] flex-col border border-stone-950 bg-white origin-bottom-right"
        >
          <header className="flex items-center justify-between border-b border-stone-950 bg-stone-950 px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              {view !== "faq" && (
                <button
                  onClick={() => setView(view === "chat" || view === "new" ? (tickets?.length ? "tickets" : "faq") : "faq")}
                  aria-label="Voltar"
                  className={`${MONO} px-1 hover:text-teal-300`}
                >
                  ←
                </button>
              )}
              <h2 className={MONO}>{TITLES[view]}</h2>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar suporte" className={`${MONO} px-1 hover:text-teal-300`}>
              ✕
            </button>
          </header>

          <div className="min-h-0 flex-1">
            {view === "faq" && <FaqView onContact={goSupport} />}
            {view === "tickets" &&
              (loggedIn ? (
                <TicketList tickets={tickets} onOpen={openChat} onNew={() => setView("new")} />
              ) : (
                <LoginGate next={pathname} />
              ))}
            {view === "new" && (
              <NewTicketForm
                onCreated={(t) => {
                  setTickets((list) => [t, ...(list ?? [])]);
                  openChat(t.id);
                }}
              />
            )}
            {view === "chat" && activeId && (
              <TicketThread
                ticketId={activeId}
                viewer="user"
                onChange={(t) =>
                  setTickets((list) => list?.map((s) => (s.id === t.id ? { ...s, status: t.status, updatedAt: t.updatedAt } : s)) ?? list)
                }
              />
            )}
          </div>
        </section>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar suporte" : "Abrir suporte"}
        aria-expanded={open}
        className="relative flex h-12 w-12 items-center justify-center border border-stone-950 bg-stone-950 font-mono text-lg text-white transition-all duration-150 hover:bg-white hover:text-stone-950 active:scale-95"
      >
        {open ? "✕" : ">_"}
        {!open && hasAnswered && (
          <span className="absolute -right-1 -top-1 h-3 w-3 border border-stone-950 bg-teal-500" title="Você tem uma resposta do suporte" />
        )}
      </button>
    </div>
  );
}

function FaqView({ onContact }: { onContact: () => void }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const items = useMemo(() => filterFaq(query), [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-950 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nas perguntas frequentes…"
          aria-label="Buscar no FAQ"
          className={FIELD}
          autoFocus
        />
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.map((item) => {
          const isOpen = expanded === item.id || (query.trim() !== "" && items.length === 1);
          return (
            <li key={item.id} className="border-b border-stone-300">
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left text-sm font-medium text-stone-950 hover:bg-stone-100"
              >
                {item.question}
                <span className={`${MONO} shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>+</span>
              </button>
              <div className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <p className="overflow-hidden px-3 text-sm leading-relaxed text-stone-600">
                  <span className="block pb-3">{item.answer}</span>
                </p>
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className={`${MONO} p-4 text-stone-500`}>Nada encontrado para “{query}”. Fale com o suporte abaixo.</li>
        )}
      </ul>

      <div className="border-t border-stone-950 p-3">
        <button onClick={onContact} className={`${BTN_SOLID} w-full`}>
          Falar com suporte / abrir ticket
        </button>
      </div>
    </div>
  );
}

function LoginGate({ next }: { next: string }) {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-4 p-5">
      <p className={`${MONO} border border-stone-950 px-2 py-1`}>ACESSO_NEGADO</p>
      <p className="text-sm text-stone-800">Você precisa estar autenticado para abrir um ticket de suporte.</p>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className={`${BTN_SOLID} inline-block`}>
        Entrar
      </Link>
    </div>
  );
}

function TicketList({ tickets, onOpen, onNew }: { tickets: TicketSummary[] | null; onOpen: (id: string) => void; onNew: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {tickets === null && <li className={`${MONO} p-4 text-stone-500`}><Loading>Carregando…</Loading></li>}
        {tickets?.length === 0 && <li className={`${MONO} p-4 text-stone-500`}>Nenhum ticket ainda.</li>}
        {tickets?.map((t) => (
          <li key={t.id} className="border-b border-stone-300">
            <button onClick={() => onOpen(t.id)} className="block w-full px-3 py-3 text-left hover:bg-stone-100">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-stone-950">{t.subject}</span>
                <StatusTag status={t.status} />
              </span>
              <span className="mt-1 block truncate text-xs text-stone-500">
                {t.lastSender === "admin" ? "Suporte: " : "Você: "}
                {t.lastMessage}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-stone-950 p-3">
        <button onClick={onNew} className={`${BTN} w-full`}>
          + Novo ticket
        </button>
      </div>
    </div>
  );
}

function NewTicketForm({ onCreated }: { onCreated: (t: TicketSummary) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const { ticket } = await supportApi.create({ subject: subject.trim(), message: message.trim() });
      onCreated(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao abrir o ticket.");
      setSending(false);
    }
  };

  return (
    <form
      className="flex h-full flex-col gap-3 overflow-y-auto p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label className="block">
        <span className={`${MONO} mb-1 block text-stone-600`}>Assunto</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={SUBJECT_MAX} required className={FIELD} />
      </label>
      <label className="flex min-h-0 flex-1 flex-col">
        <span className={`${MONO} mb-1 block text-stone-600`}>Mensagem</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MESSAGE_MAX}
          required
          className={`${FIELD} min-h-32 flex-1 resize-none`}
        />
      </label>
      {error && (
        <p className={`${MONO} text-red-700`} role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={sending || !subject.trim() || !message.trim()} className={BTN_SOLID}>
        {sending ? <LoadingLabel>Enviando…</LoadingLabel> : "Abrir ticket"}
      </button>
    </form>
  );
}
