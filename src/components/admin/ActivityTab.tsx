"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type ActivityEventName, type ActivityFilters, type AdminActivityLog, type AdminActivitySummary } from "@/lib/adminApi";
import { errorMessage } from "@/lib/messages";
import { describeUserAgent } from "@/lib/userAgent";
import { useI18n, type ClientTranslator } from "@/i18n/I18nProvider";
import { INTL_LOCALE } from "@/i18n/config";
import { Loading } from "../ui/Loading";
import Alert from "../ui/Alert";

const PERIODS = [
  { days: 1, key: "h24" },
  { days: 7, key: "d7" },
  { days: 30, key: "d30" },
  { days: 90, key: "d90" },
  { days: 180, key: "d180" },
] as const;

const EVENTS: ActivityEventName[] = ["pageview", "view", "use", "usage", "usage_blocked", "login", "login_failed", "register", "logout"];

const EVENT_BADGE: Partial<Record<ActivityEventName, string>> = {
  login_failed: "badge-warn",
  usage_blocked: "badge-warn",
  login: "badge-brand",
  register: "badge-brand",
  use: "badge-brand",
  usage: "badge-brand",
};

type Place = { city: string | null; region: string | null; country: string | null };

const emptyDraft = { event: "", email: "", ip: "", tool: "", country: "", path: "" };

/** Textos e formatadores do idioma atual (nome do país, local, data completa, navegador/aparelho). */
function useFormatters(tr: ClientTranslator) {
  const { locale, t, raw } = tr;
  return useMemo(() => {
    const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames([INTL_LOCALE[locale]], { type: "region" }) : null;
    const countryName = (code: string | null) => {
      if (!code) return null;
      try {
        return regionNames?.of(code) ?? code;
      } catch {
        return code;
      }
    };
    const place = (l: Place) => {
      const parts = [l.city, l.region, countryName(l.country)].filter(Boolean);
      return parts.length ? parts.join(", ") : "—";
    };
    const dateTime = (iso: string) =>
      tr.dateTime(iso, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const events = raw("admin.activity.events") as Record<string, string>;
    const ua = (agent: string | null) => {
      const d = describeUserAgent(agent);
      const word = (v: string) => (v === "other" || v === "unknown" ? t(`admin.ua.${v}`) : v);
      return { browser: word(d.browser), os: word(d.os), device: t(`admin.ua.${d.device}`), bot: d.bot };
    };
    return { place, dateTime, eventLabel: (ev: string) => events[ev] ?? ev, ua };
  }, [tr, locale, t, raw]);
}

function Stat({ label, value }: { label: string; value: number }) {
  const { number } = useI18n();
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">{number(value)}</p>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { key: string; label: React.ReactNode; hint?: string; count: number; onClick?: () => void }[] }) {
  const { t, number } = useI18n();
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">{t("admin.activity.noData")}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                {r.onClick ? (
                  <button type="button" onClick={r.onClick} className="min-w-0 truncate text-left text-teal-800 hover:underline" title={t("admin.activity.filterByValue")}>
                    {r.label}
                  </button>
                ) : (
                  <span className="min-w-0 truncate text-stone-800">{r.label}</span>
                )}
                <span className="shrink-0 tabular-nums text-stone-700">{number(r.count)}</span>
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

function Detail({ log, fmt }: { log: AdminActivityLog; fmt: ReturnType<typeof useFormatters> }) {
  const { t } = useI18n();
  const ua = fmt.ua(log.userAgent);
  const items: [string, React.ReactNode][] = [
    [t("admin.activity.detail.userId"), log.userId ? <span className="font-mono text-xs">{log.userId}</span> : t("admin.activity.detail.guest")],
    [t("admin.activity.detail.plan"), log.role ?? "—"],
    [t("admin.activity.detail.place"), fmt.place(log)],
    [t("admin.activity.detail.coords"), log.latitude !== null && log.longitude !== null ? <span className="font-mono text-xs">{log.latitude}, {log.longitude}</span> : "—"],
    [t("admin.activity.detail.timezone"), log.timezone ?? "—"],
    [t("admin.activity.detail.language"), log.language ?? "—"],
    [t("admin.activity.detail.browserOs"), `${ua.browser} · ${ua.os} · ${ua.device}${ua.bot ? ` · ${t("admin.activity.detail.possibleBot")}` : ""}`],
    [t("admin.activity.detail.fullUa"), log.userAgent ? <span className="break-all font-mono text-xs">{log.userAgent}</span> : "—"],
    [t("admin.activity.detail.referrer"), log.referrer ? <span className="break-all font-mono text-xs">{log.referrer}</span> : t("admin.activity.detail.direct")],
    [t("admin.activity.detail.fileType"), log.kind ?? "—"],
    [t("admin.activity.detail.recordId"), <span key="id" className="font-mono text-xs">{log.id}</span>],
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
  const tr = useI18n();
  const { t, tn, number } = tr;
  const fmt = useFormatters(tr);
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
      setError(errorMessage(err, t("msg.admin.loadFailed")));
    }
  }, [filters, t]);

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
      setError(errorMessage(err, t("msg.admin.loadFailed")));
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
      <p className="max-w-3xl text-sm text-stone-600">{t("admin.activity.intro")}</p>

      <form
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(draft);
        }}
      >
        <div>
          <label className="label" htmlFor="act-days">{t("admin.activity.fPeriod")}</label>
          <select id="act-days" className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIODS.map((p) => (
              <option key={p.days} value={p.days}>{t("admin.activity.periodOption", { label: t(`admin.activity.periods.${p.key}`) })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="act-event">{t("admin.activity.fEvent")}</label>
          <select id="act-event" className="input" value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })}>
            <option value="">{t("admin.activity.fAll")}</option>
            {EVENTS.map((ev) => (
              <option key={ev} value={ev}>{fmt.eventLabel(ev)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="act-email">{t("admin.activity.fEmail")}</label>
          <input id="act-email" className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder={t("admin.activity.fEmailPh")} maxLength={100} />
        </div>
        <div>
          <label className="label" htmlFor="act-ip">{t("admin.activity.fIp")}</label>
          <input id="act-ip" className="input" value={draft.ip} onChange={(e) => setDraft({ ...draft, ip: e.target.value })} placeholder={t("admin.activity.fIpPh")} maxLength={64} />
        </div>
        <div>
          <label className="label" htmlFor="act-tool">{t("admin.activity.fTool")}</label>
          <input id="act-tool" className="input" value={draft.tool} onChange={(e) => setDraft({ ...draft, tool: e.target.value })} placeholder={t("admin.activity.fToolPh")} maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="act-country">{t("admin.activity.fCountry")}</label>
          <input id="act-country" className="input" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} placeholder={t("admin.activity.fCountryPh")} maxLength={2} />
        </div>
        <div>
          <label className="label" htmlFor="act-path">{t("admin.activity.fPage")}</label>
          <input id="act-path" className="input" value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })} placeholder={t("admin.activity.fPagePh")} maxLength={100} />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">{t("admin.activity.filter")}</button>
          {hasFilters && (
            <button type="button" className="btn-secondary" onClick={() => { setDraft(emptyDraft); setApplied(emptyDraft); }}>
              {t("admin.activity.clear")}
            </button>
          )}
        </div>
      </form>

      {error && <Alert variant="error">{error}</Alert>}
      {!error && (!logs || !summary) && <Loading>{t("admin.activity.loading")}</Loading>}

      {!error && logs && summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label={t("admin.activity.statEvents")} value={summary.totals.events} />
            <Stat label={t("admin.activity.statUsers")} value={summary.totals.users} />
            <Stat label={t("admin.activity.statIps")} value={summary.totals.ips} />
            <Stat label={t("admin.activity.statLogins")} value={summary.totals.logins} />
            <Stat label={t("admin.activity.statFailed")} value={summary.totals.failedLogins} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <TopList
              title={t("admin.activity.topUsers")}
              rows={summary.topUsers.map((u) => ({
                key: u.userId,
                label: u.email,
                hint: t("admin.activity.userHint", { ips: tn("admin.activity.ipCount", u.ips), date: fmt.dateTime(u.last) }),
                count: u.count,
                onClick: () => applyFilter({ email: u.email }),
              }))}
            />
            <TopList
              title={t("admin.activity.topIps")}
              rows={summary.topIps.map((i) => ({
                key: i.ip,
                label: <span className="font-mono text-xs">{i.ip}</span>,
                hint: t("admin.activity.ipHint", { place: fmt.place({ city: i.city, region: null, country: i.country }), users: tn("admin.activity.userCount", i.users) }),
                count: i.count,
                onClick: () => applyFilter({ ip: i.ip }),
              }))}
            />
            <TopList
              title={t("admin.activity.topPlaces")}
              rows={summary.topPlaces.map((p) => ({
                key: `${p.country}-${p.region}-${p.city}`,
                label: fmt.place(p),
                count: p.count,
                onClick: () => applyFilter({ country: p.country }),
              }))}
            />
            <TopList
              title={t("admin.activity.topTools")}
              rows={summary.topTools.map((x) => ({ key: x.tool, label: x.tool, count: x.count, onClick: () => applyFilter({ tool: x.tool }) }))}
            />
            <TopList
              title={t("admin.activity.topPaths")}
              rows={summary.topPaths.map((p) => ({ key: p.path, label: <span className="font-mono text-xs">{p.path}</span>, count: p.count, onClick: () => applyFilter({ path: p.path }) }))}
            />
            <TopList
              title={t("admin.activity.byEvent")}
              rows={summary.byEvent.map((e) => ({ key: e.event, label: fmt.eventLabel(e.event), count: e.count, onClick: () => applyFilter({ event: e.event }) }))}
            />
          </div>

          <TopList title={t("admin.activity.byDay")} rows={summary.byDay.map((d) => ({ key: d.day, label: tr.date(`${d.day}T12:00:00`), count: d.count }))} />

          <div>
            <p className="mb-2 text-sm text-stone-600">
              {total !== null ? t("admin.activity.summary", { total: number(total) }) : ""}{t("admin.activity.showing", { shown: number(logs.length) })}
            </p>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[64rem] text-sm">
                <thead className="border-b border-stone-200 bg-stone-50">
                  <tr>
                    <th className="table-th">{t("admin.activity.colDate")}</th>
                    <th className="table-th">{t("admin.activity.colEvent")}</th>
                    <th className="table-th">{t("admin.activity.colUser")}</th>
                    <th className="table-th">{t("admin.activity.colIp")}</th>
                    <th className="table-th">{t("admin.activity.colPlace")}</th>
                    <th className="table-th">{t("admin.activity.colPage")}</th>
                    <th className="table-th">{t("admin.activity.colBrowser")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-td py-10 text-center text-stone-500">{t("admin.activity.empty")}</td>
                    </tr>
                  )}
                  {logs.map((log) => {
                    const ua = fmt.ua(log.userAgent);
                    const open = openId === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr className="cursor-pointer hover:bg-stone-50" onClick={() => setOpenId(open ? null : log.id)} aria-expanded={open}>
                          <td className="table-td whitespace-nowrap">{fmt.dateTime(log.createdAt)}</td>
                          <td className="table-td">
                            <span className={`${EVENT_BADGE[log.event] ?? "badge-neutral"} whitespace-nowrap`}>{fmt.eventLabel(log.event)}</span>
                          </td>
                          <td className="table-td">
                            {log.email ? (
                              <button type="button" className="text-teal-800 hover:underline" onClick={(e) => { e.stopPropagation(); applyFilter({ email: log.email! }); }}>
                                {log.email}
                              </button>
                            ) : (
                              <span className="text-stone-500">{t("admin.activity.guest")}</span>
                            )}
                          </td>
                          <td className="table-td">
                            <button type="button" className="font-mono text-xs text-teal-800 hover:underline" onClick={(e) => { e.stopPropagation(); applyFilter({ ip: log.ip }); }}>
                              {log.ip}
                            </button>
                          </td>
                          <td className="table-td">{fmt.place(log)}</td>
                          <td className="table-td">
                            {log.tool ? (
                              <span>{log.tool}{log.kind ? ` · ${log.kind}` : ""}</span>
                            ) : log.path ? (
                              <span className="font-mono text-xs">{log.path}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="table-td whitespace-nowrap">{ua.browser} · {ua.os}{ua.bot ? ` · ${t("admin.activity.bot")}` : ""}</td>
                        </tr>
                        {open && (
                          <tr className="bg-stone-50">
                            <td colSpan={7} className="px-4 py-4">
                              <Detail log={log} fmt={fmt} />
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
                  {loadingMore ? t("admin.activity.loadingMore") : t("admin.activity.loadMore")}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
