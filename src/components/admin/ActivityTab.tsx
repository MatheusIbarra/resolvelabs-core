"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { adminApi, type ActivityEventName, type ActivityFilters, type AdminActivityLog, type AdminActivitySummary } from "@/lib/adminApi";
import { ADMIN_MSG, errorMessage } from "@/lib/messages";
import { describeUserAgent } from "@/lib/userAgent";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";

const PERIODS = [
  { days: 1, label: "24 horas" },
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
  { days: 180, label: "180 dias" },
];

const EVENT_LABEL: Record<ActivityEventName, string> = {
  pageview: "Visita à página",
  view: "Visita à ferramenta",
  use: "Uso de ferramenta",
  usage: "Uso com cota",
  usage_blocked: "Limite atingido",
  login: "Login",
  login_failed: "Login recusado",
  register: "Cadastro",
  logout: "Saída",
};

const EVENT_BADGE: Partial<Record<ActivityEventName, string>> = {
  login_failed: "badge-warn",
  usage_blocked: "badge-warn",
  login: "badge-brand",
  register: "badge-brand",
  use: "badge-brand",
  usage: "badge-brand",
};

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["pt-BR"], { type: "region" }) : null;
const countryName = (code: string | null) => {
  if (!code) return null;
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
};

const place = (l: { city: string | null; region: string | null; country: string | null }) => {
  const parts = [l.city, l.region, countryName(l.country)].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

const emptyDraft = { event: "", email: "", ip: "", tool: "", country: "", path: "" };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { key: string; label: React.ReactNode; hint?: string; count: number; onClick?: () => void }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">Sem dados no período.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                {r.onClick ? (
                  <button type="button" onClick={r.onClick} className="min-w-0 truncate text-left text-teal-800 hover:underline" title="Filtrar por este valor">
                    {r.label}
                  </button>
                ) : (
                  <span className="min-w-0 truncate text-stone-800">{r.label}</span>
                )}
                <span className="shrink-0 tabular-nums text-stone-700">{r.count.toLocaleString("pt-BR")}</span>
              </div>
              {r.hint && <p className="truncate text-xs text-stone-500">{r.hint}</p>}
              <div className="mt-1 h-1 rounded-full bg-stone-100">
                <div className="h-1 rounded-full bg-teal-700" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Detail({ log }: { log: AdminActivityLog }) {
  const ua = describeUserAgent(log.userAgent);
  const items: [string, React.ReactNode][] = [
    ["Usuário (id)", log.userId ? <span className="font-mono text-xs">{log.userId}</span> : "Visitante sem login"],
    ["Plano", log.role ?? "—"],
    ["Local", place(log)],
    ["Coordenadas aproximadas", log.latitude !== null && log.longitude !== null ? <span className="font-mono text-xs">{log.latitude}, {log.longitude}</span> : "—"],
    ["Fuso horário", log.timezone ?? "—"],
    ["Idioma", log.language ?? "—"],
    ["Navegador / sistema", `${ua.browser} · ${ua.os} · ${ua.device}${ua.bot ? " · possível robô" : ""}`],
    ["User-Agent completo", log.userAgent ? <span className="break-all font-mono text-xs">{log.userAgent}</span> : "—"],
    ["Origem (referrer)", log.referrer ? <span className="break-all font-mono text-xs">{log.referrer}</span> : "Acesso direto"],
    ["Tipo de arquivo", log.kind ?? "—"],
    ["Id do registro", <span key="id" className="font-mono text-xs">{log.id}</span>],
  ];
  return (
    <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-medium text-stone-500">{k}</dt>
          <dd className="text-sm text-stone-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ActivityTab() {
  const [days, setDays] = useState(7);
  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [summary, setSummary] = useState<AdminActivitySummary | null>(null);
  const [logs, setLogs] = useState<AdminActivityLog[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filters = useCallback((): ActivityFilters => ({ days, ...applied }), [days, applied]);

  const load = useCallback(async () => {
    setError(null);
    setLogs(null);
    setSummary(null);
    setOpenId(null);
    try {
      const f = filters();
      const [list, sum] = await Promise.all([adminApi.activity(f), adminApi.activitySummary(f)]);
      setLogs(list.logs);
      setTotal(list.total);
      setCursor(list.nextCursor);
      setSummary(sum);
    } catch (err) {
      setError(errorMessage(err, ADMIN_MSG.loadFailed));
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const list = await adminApi.activity(filters(), cursor);
      setLogs((prev) => [...(prev ?? []), ...list.logs]);
      setCursor(list.nextCursor);
    } catch (err) {
      setError(errorMessage(err, ADMIN_MSG.loadFailed));
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilter = (patch: Partial<typeof emptyDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setApplied(next);
  };

  const hasFilters = Object.values(applied).some(Boolean);

  return (
    <section className="space-y-6">
      <p className="max-w-3xl text-sm text-stone-600">
        Cada visita, uso de ferramenta, login, cadastro e saída, com o usuário, o IP, o local aproximado e o navegador. A localização vem do IP e é só uma estimativa.
        Nomes e conteúdo de arquivos nunca são registrados. Os registros são apagados automaticamente após 180 dias.
      </p>

      <form
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(draft);
        }}
      >
        <div>
          <label className="label" htmlFor="act-days">Período</label>
          <select id="act-days" className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIODS.map((p) => (
              <option key={p.days} value={p.days}>Últimas {p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="act-event">Evento</label>
          <select id="act-event" className="input" value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })}>
            <option value="">Todos</option>
            {(Object.keys(EVENT_LABEL) as ActivityEventName[]).map((ev) => (
              <option key={ev} value={ev}>{EVENT_LABEL[ev]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="act-email">E-mail</label>
          <input id="act-email" className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="parte do e-mail" maxLength={100} />
        </div>
        <div>
          <label className="label" htmlFor="act-ip">IP</label>
          <input id="act-ip" className="input" value={draft.ip} onChange={(e) => setDraft({ ...draft, ip: e.target.value })} placeholder="começo do IP" maxLength={64} />
        </div>
        <div>
          <label className="label" htmlFor="act-tool">Ferramenta</label>
          <input id="act-tool" className="input" value={draft.tool} onChange={(e) => setDraft({ ...draft, tool: e.target.value })} placeholder="ex.: planilha-para-ofx" maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="act-country">País (sigla)</label>
          <input id="act-country" className="input" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} placeholder="ex.: BR" maxLength={2} />
        </div>
        <div>
          <label className="label" htmlFor="act-path">Página</label>
          <input id="act-path" className="input" value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })} placeholder="ex.: /ferramentas" maxLength={100} />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">Filtrar</button>
          {hasFilters && (
            <button type="button" className="btn-secondary" onClick={() => { setDraft(emptyDraft); setApplied(emptyDraft); }}>
              Limpar
            </button>
          )}
        </div>
      </form>

      {error && <Alert variant="error">{error}</Alert>}
      {!error && (!logs || !summary) && <Loading>Carregando registros…</Loading>}

      {!error && logs && summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Eventos" value={summary.totals.events} />
            <Stat label="Usuários distintos" value={summary.totals.users} />
            <Stat label="IPs distintos" value={summary.totals.ips} />
            <Stat label="Logins" value={summary.totals.logins} />
            <Stat label="Logins recusados" value={summary.totals.failedLogins} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <TopList
              title="Usuários mais ativos"
              rows={summary.topUsers.map((u) => ({
                key: u.userId,
                label: u.email,
                hint: `${u.ips} ${u.ips === 1 ? "IP" : "IPs"} · último acesso ${fmtDateTime(u.last)}`,
                count: u.count,
                onClick: () => applyFilter({ email: u.email }),
              }))}
            />
            <TopList
              title="IPs mais frequentes"
              rows={summary.topIps.map((i) => ({
                key: i.ip,
                label: <span className="font-mono text-xs">{i.ip}</span>,
                hint: `${place({ city: i.city, region: null, country: i.country })} · ${i.users} ${i.users === 1 ? "usuário" : "usuários"}`,
                count: i.count,
                onClick: () => applyFilter({ ip: i.ip }),
              }))}
            />
            <TopList
              title="Locais"
              rows={summary.topPlaces.map((p) => ({
                key: `${p.country}-${p.region}-${p.city}`,
                label: place(p),
                count: p.count,
                onClick: () => applyFilter({ country: p.country }),
              }))}
            />
            <TopList
              title="Ferramentas usadas"
              rows={summary.topTools.map((t) => ({ key: t.tool, label: t.tool, count: t.count, onClick: () => applyFilter({ tool: t.tool }) }))}
            />
            <TopList
              title="Páginas mais visitadas"
              rows={summary.topPaths.map((p) => ({ key: p.path, label: <span className="font-mono text-xs">{p.path}</span>, count: p.count, onClick: () => applyFilter({ path: p.path }) }))}
            />
            <TopList
              title="Por tipo de evento"
              rows={summary.byEvent.map((e) => ({ key: e.event, label: EVENT_LABEL[e.event] ?? e.event, count: e.count, onClick: () => applyFilter({ event: e.event }) }))}
            />
          </div>

          <TopList title="Eventos por dia" rows={summary.byDay.map((d) => ({ key: d.day, label: new Date(`${d.day}T12:00:00`).toLocaleDateString("pt-BR"), count: d.count }))} />

          <div>
            <p className="mb-2 text-sm text-stone-600">
              {total !== null ? `${total.toLocaleString("pt-BR")} registros no período. ` : ""}Mostrando {logs.length.toLocaleString("pt-BR")}. Clique numa linha para ver todos os dados.
            </p>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[64rem] text-sm">
                <thead className="border-b border-stone-200 bg-stone-50">
                  <tr>
                    <th className="table-th">Data e hora</th>
                    <th className="table-th">Evento</th>
                    <th className="table-th">Usuário</th>
                    <th className="table-th">IP</th>
                    <th className="table-th">Local</th>
                    <th className="table-th">Página ou ferramenta</th>
                    <th className="table-th">Navegador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-td py-10 text-center text-stone-500">Nenhum registro com estes filtros.</td>
                    </tr>
                  )}
                  {logs.map((log) => {
                    const ua = describeUserAgent(log.userAgent);
                    const open = openId === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr className="cursor-pointer hover:bg-stone-50" onClick={() => setOpenId(open ? null : log.id)} aria-expanded={open}>
                          <td className="table-td whitespace-nowrap">{fmtDateTime(log.createdAt)}</td>
                          <td className="table-td">
                            <span className={`${EVENT_BADGE[log.event] ?? "badge-neutral"} whitespace-nowrap`}>{EVENT_LABEL[log.event] ?? log.event}</span>
                          </td>
                          <td className="table-td">
                            {log.email ? (
                              <button type="button" className="text-teal-800 hover:underline" onClick={(e) => { e.stopPropagation(); applyFilter({ email: log.email! }); }}>
                                {log.email}
                              </button>
                            ) : (
                              <span className="text-stone-500">Visitante</span>
                            )}
                          </td>
                          <td className="table-td">
                            <button type="button" className="font-mono text-xs text-teal-800 hover:underline" onClick={(e) => { e.stopPropagation(); applyFilter({ ip: log.ip }); }}>
                              {log.ip}
                            </button>
                          </td>
                          <td className="table-td">{place(log)}</td>
                          <td className="table-td">
                            {log.tool ? (
                              <span>{log.tool}{log.kind ? ` · ${log.kind}` : ""}</span>
                            ) : log.path ? (
                              <span className="font-mono text-xs">{log.path}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="table-td whitespace-nowrap">{ua.browser} · {ua.os}{ua.bot ? " · robô" : ""}</td>
                        </tr>
                        {open && (
                          <tr className="bg-stone-50">
                            <td colSpan={7} className="px-4 py-4">
                              <Detail log={log} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {cursor && (
              <div className="mt-4 text-center">
                <button className="btn-secondary" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Carregando…" : "Carregar mais"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
