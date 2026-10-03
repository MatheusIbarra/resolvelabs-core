"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { usePolling } from "@/hooks/usePolling";
import { buildFaq, filterFaq } from "@/lib/supportFaq";
import { supportApi, type TicketSummary } from "@/lib/supportApi";
import TicketThread, { StatusTag } from "./support/TicketThread";

type View = "faq" | "tickets" | "new" | "chat";

import { Loading, LoadingLabel } from "./ui/Loading";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 4000;
const LIST_POLL_OPEN_MS = 15000;
const LIST_POLL_CLOSED_MS = 60000;

const TITLE_KEYS = { faq: "titleFaq", tickets: "titleTickets", new: "titleNew", chat: "titleChat" } as const;

/** Widget flutuante de suporte: FAQ pesquisável, abertura de ticket e chat por polling. */
export default function SupportWidget() {
  const { t } = useI18n();
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

  const hasAnswered = tickets?.some((ticket) => ticket.status === "answered") ?? false;

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
          aria-label={t("support.widget.titleFaq")}
          className="flex h-[min(34rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] animate-[scale-in_0.25s_cubic-bezier(0.22,1,0.36,1)] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl origin-bottom-right"
        >
          <header className="flex items-center justify-between border-b border-stone-200 bg-white px-3 py-3 text-stone-900">
            <div className="flex items-center gap-2">
              {view !== "faq" && (
                <button
                  onClick={() => setView(view === "chat" || view === "new" ? (tickets?.length ? "tickets" : "faq") : "faq")}
                  aria-label={t("support.widget.back")}
                  className="rounded-md px-2 py-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  ←
                </button>
              )}
              <h2 className="text-sm font-semibold text-stone-900">{t(`support.widget.${TITLE_KEYS[view]}`)}</h2>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t("support.widget.closeSupport")} className="rounded-md px-2 py-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900">
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
                onCreated={(created) => {
                  setTickets((list) => [created, ...(list ?? [])]);
                  openChat(created.id);
                }}
              />
            )}
            {view === "chat" && activeId && (
              <TicketThread
                ticketId={activeId}
                viewer="user"
                onChange={(changed) =>
                  setTickets((list) => list?.map((s) => (s.id === changed.id ? { ...s, status: changed.status, updatedAt: changed.updatedAt } : s)) ?? list)
                }
              />
            )}
          </div>
        </section>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("support.widget.closeSupport") : t("support.widget.openSupport")}
        aria-expanded={open}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg transition-all duration-150 hover:bg-teal-800 active:scale-95"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
        {!open && hasAnswered && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500" title={t("support.widget.answeredHint")} />
        )}
      </button>
    </div>
  );
}

function FaqView({ onContact }: { onContact: () => void }) {
  const tr = useI18n();
  const { t } = tr;
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const faq = useMemo(() => buildFaq(tr), [tr]);
  const items = useMemo(() => filterFaq(faq, query), [faq, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("support.widget.searchPlaceholder")}
          aria-label={t("support.widget.searchAria")}
          className="input"
          autoFocus
        />
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.map((item) => {
          const isOpen = expanded === item.id || (query.trim() !== "" && items.length === 1);
          return (
            <li key={item.id} className="border-b border-stone-100">
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                {item.question}
                <span className={`text-xs font-medium shrink-0 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>+</span>
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
          <li className="p-4 text-sm text-stone-500">{t("support.widget.nothingFound", { query })}</li>
        )}
      </ul>

      <div className="border-t border-stone-200 p-3">
        <button onClick={onContact} className="btn-primary w-full">
          {t("support.widget.contactCta")}
        </button>
      </div>
    </div>
  );
}

function LoginGate({ next }: { next: string }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col items-start justify-center gap-4 p-5">
      <span className="badge-warn">{t("support.widget.gateBadge")}</span>
      <p className="text-sm text-stone-800">{t("support.widget.gateBody")}</p>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary inline-block">
        {t("support.widget.gateLogin")}
      </Link>
    </div>
  );
}

function TicketList({ tickets, onOpen, onNew }: { tickets: TicketSummary[] | null; onOpen: (id: string) => void; onNew: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {tickets === null && <li className="p-4 text-sm text-stone-500"><Loading>{t("common.ui.loading")}</Loading></li>}
        {tickets?.length === 0 && <li className="p-4 text-sm text-stone-500">{t("support.widget.empty")}</li>}
        {tickets?.map((ticket) => (
          <li key={ticket.id} className="border-b border-stone-100">
            <button onClick={() => onOpen(ticket.id)} className="block w-full px-3 py-3 text-left hover:bg-stone-50">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-stone-900">{ticket.subject}</span>
                <StatusTag status={ticket.status} />
              </span>
              <span className="mt-1 block truncate text-xs text-stone-500">
                {ticket.lastSender === "admin" ? t("support.widget.supportPrefix") : t("support.widget.youPrefix")}
                {ticket.lastMessage}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-stone-200 p-3">
        <button onClick={onNew} className="btn-secondary btn-sm w-full">
          {t("support.widget.newTicket")}
        </button>
      </div>
    </div>
  );
}

function NewTicketForm({ onCreated }: { onCreated: (t: TicketSummary) => void }) {
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t("support.widget.createFailed"));
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
        <span className="label">{t("support.widget.subject")}</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={SUBJECT_MAX} required className="input" />
      </label>
      <label className="flex min-h-0 flex-1 flex-col">
        <span className="label">{t("support.widget.message")}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MESSAGE_MAX}
          required
          className="input min-h-32 flex-1 resize-none"
        />
      </label>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={sending || !subject.trim() || !message.trim()} className="btn-primary">
        {sending ? <LoadingLabel>{t("support.widget.sending")}</LoadingLabel> : t("support.widget.openTicket")}
      </button>
    </form>
  );
}
