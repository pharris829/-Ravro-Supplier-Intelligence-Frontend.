"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getObservabilityOverview, getRequestLogs, getErrorLogs,
  resolveErrorLog, deleteErrorLog, clearResolvedErrors, getObsMetrics, getObsEvents,
  type RequestLog, type ErrorLog, type ObsOverview, type ObsMetrics, type ObsEvent,
} from "@/lib/api";

type Tab = "overview" | "requests" | "errors" | "performance" | "events";

// ─── Micro components ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ code }: { code: number }) {
  const color = code < 300 ? "text-emerald-400" : code < 400 ? "text-blue-400" : code < 500 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-xs font-bold tabular-nums ${color}`}>{code}</span>;
}

function MiniBarChart({ data, color = "bg-indigo-500", label }: { data: number[]; color?: string; label?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      {label && <p className="text-xs text-neutral-500 mb-1">{label}</p>}
      <div className="flex items-end gap-0.5 h-12">
        {data.map((v, i) => (
          <div key={i} className={`flex-1 ${color} rounded-t opacity-70`}
            style={{ height: `${Math.max(2, (v / max) * 48)}px` }} />
        ))}
      </div>
    </div>
  );
}

function RelTime({ iso }: { iso: string }) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = diff / 1000;
  const label = s < 60 ? `${Math.round(s)}s ago` : s < 3600 ? `${Math.round(s/60)}m ago` : s < 86400 ? `${Math.round(s/3600)}h ago` : `${Math.round(s/86400)}d ago`;
  return <span className="text-neutral-500 text-xs" title={new Date(iso).toLocaleString()}>{label}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ObservabilityPage() {
  const [tab, setTab]         = useState<Tab>("overview");
  const [overview, setOV]     = useState<ObsOverview | null>(null);
  const [requests, setReqs]   = useState<RequestLog[]>([]);
  const [reqTotal, setReqTotal] = useState(0);
  const [errors,   setErrors] = useState<ErrorLog[]>([]);
  const [metrics,  setMetrics] = useState<ObsMetrics | null>(null);
  const [events,   setEvents] = useState<ObsEvent[]>([]);
  const [loading,  setLoading] = useState(true);
  const [reqFilter, setReqFilter] = useState<"all"|"2xx"|"4xx"|"5xx">("all");
  const [reqPath, setReqPath]    = useState("");
  const [errResolved, setErrResolved] = useState(false);
  const [evtFilter, setEvtFilter]     = useState("all");
  const [resolving, setResolving]     = useState<string|null>(null);
  const [expandedReq, setExpandedReq] = useState<string|null>(null);
  const [expandedErr, setExpandedErr] = useState<string|null>(null);

  const loadOverview = useCallback(async () => {
    const r = await getObservabilityOverview().catch(() => null);
    if (r) setOV(r);
  }, []);

  const loadRequests = useCallback(async () => {
    const params: Record<string, string> = {};
    if (reqFilter !== "all") params.status_class = reqFilter;
    if (reqPath.trim()) params.path = reqPath.trim();
    params.limit = "100";
    const r = await getRequestLogs(params as never).catch(() => null);
    if (r) { setReqs(r.requests); setReqTotal(r.total); }
  }, [reqFilter, reqPath]);

  const loadErrors  = useCallback(() => getErrorLogs(errResolved).then(r => setErrors(r.errors)).catch(() => {}), [errResolved]);
  const loadMetrics = useCallback(() => getObsMetrics().then(setMetrics).catch(() => {}), []);
  const loadEvents  = useCallback(() => getObsEvents(evtFilter === "all" ? undefined : evtFilter).then(r => setEvents(r.events)).catch(() => {}), [evtFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([loadOverview(), loadRequests(), loadErrors(), loadMetrics(), loadEvents()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab === "requests") loadRequests(); }, [tab, loadRequests]);
  useEffect(() => { if (tab === "errors")   loadErrors();   }, [tab, loadErrors]);
  useEffect(() => { if (tab === "performance") loadMetrics(); }, [tab, loadMetrics]);
  useEffect(() => { if (tab === "events")   loadEvents();   }, [tab, loadEvents]);

  async function handleResolve(id: string, resolved: boolean) {
    setResolving(id);
    await resolveErrorLog(id, resolved);
    await loadErrors();
    setResolving(null);
  }

  async function handleDeleteError(id: string) {
    if (!confirm("Delete this error log?")) return;
    await deleteErrorLog(id);
    await loadErrors();
  }

  const rt = overview?.realtime;
  const healthy = rt && parseFloat(rt.error_rate) < 5;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview",     label: "Overview"   },
    { key: "requests",     label: "Requests",   badge: reqTotal || undefined },
    { key: "errors",       label: "Errors",     badge: errors.filter(e => !e.resolved).length || undefined },
    { key: "performance",  label: "Performance" },
    { key: "events",       label: "Events"      },
  ];

  const STATUS_EVT_COLOR: Record<string, string> = {
    success: "text-emerald-400", failed: "text-red-400", retrying: "text-yellow-400",
    running: "text-blue-400", pending: "text-neutral-500",
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Observability</h1>
          <p className="text-sm text-neutral-400 mt-1">Logs, errors, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          {rt && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${healthy ? "bg-emerald-950 border-emerald-900 text-emerald-400" : "bg-red-950 border-red-900 text-red-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${healthy ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
              {healthy ? "System healthy" : "Issues detected"}
            </div>
          )}
          <button onClick={() => { loadOverview(); loadRequests(); loadErrors(); loadMetrics(); loadEvents(); }}
            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
            {t.label}
            {t.badge && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-indigo-500" : "bg-red-900 text-red-300"}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {loading && tab === "overview" ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ─── OVERVIEW ─── */}
          {tab === "overview" && rt && (
            <div>
              <div className="grid grid-cols-6 gap-3 mb-6">
                <StatCard label="Requests/min"    value={rt.requests_1m}    color="text-white" />
                <StatCard label="Errors/min"      value={rt.errors_1m}     color={rt.errors_1m > 0 ? "text-red-400" : "text-emerald-400"} />
                <StatCard label="Error rate"      value={`${rt.error_rate}%`} color={parseFloat(rt.error_rate) > 5 ? "text-red-400" : "text-emerald-400"} />
                <StatCard label="p50 latency"     value={`${rt.p50_ms}ms`} />
                <StatCard label="p95 latency"     value={`${rt.p95_ms}ms`} color={rt.p95_ms > 500 ? "text-yellow-400" : "text-white"} />
                <StatCard label="p99 latency"     value={`${rt.p99_ms}ms`} color={rt.p99_ms > 1000 ? "text-red-400" : "text-white"} />
              </div>

              {/* Status distribution */}
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">Status Distribution (last hour)</h2>
                  <div className="space-y-3">
                    {overview?.status_distribution.map(({ bucket, count }) => {
                      const total = overview.status_distribution.reduce((s, r) => s + r.count, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const color = bucket === "2xx" ? "bg-emerald-500" : bucket === "3xx" ? "bg-blue-500" : bucket === "4xx" ? "bg-yellow-500" : "bg-red-500";
                      return (
                        <div key={bucket}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-400">{bucket}</span>
                            <span className="text-neutral-300">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 24h volume chart */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">Request Volume (24h)</h2>
                  {(overview?.hourly_volume.length ?? 0) > 0 ? (
                    <>
                      <MiniBarChart data={overview!.hourly_volume.map(h => h.requests)} color="bg-indigo-500" />
                      <div className="flex justify-between text-xs text-neutral-600 mt-1">
                        <span>24h ago</span><span>now</span>
                      </div>
                    </>
                  ) : <p className="text-neutral-600 text-xs">No data yet — requests are being collected</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Top paths */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-800"><h2 className="text-xs font-semibold text-neutral-400">Top Endpoints (5m)</h2></div>
                  <table className="w-full text-xs">
                    <tbody>
                      {rt.top_paths.slice(0, 8).map(({ path, count }) => (
                        <tr key={path} className="border-b border-neutral-800/40">
                          <td className="px-4 py-2 text-neutral-300 font-mono">{path}</td>
                          <td className="px-4 py-2 text-right text-white font-semibold tabular-nums">{count}</td>
                        </tr>
                      ))}
                      {rt.top_paths.length === 0 && <tr><td colSpan={2} className="px-4 py-4 text-center text-neutral-600">No requests yet</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Top errors */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-800"><h2 className="text-xs font-semibold text-neutral-400">Active Errors</h2></div>
                  <div className="divide-y divide-neutral-800/50">
                    {(overview?.top_errors ?? []).map(e => (
                      <div key={e.id} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded tabular-nums">×{e.occurrence_count}</span>
                          <span className="text-xs text-red-300 truncate">{e.message}</span>
                        </div>
                        <p className="text-xs text-neutral-600">{e.path} · <RelTime iso={e.last_seen} /></p>
                      </div>
                    ))}
                    {(overview?.top_errors ?? []).length === 0 && <div className="px-4 py-4 text-center text-neutral-600 text-xs">No errors 🎉</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── REQUESTS ─── */}
          {tab === "requests" && (
            <div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                  {(["all","2xx","4xx","5xx"] as const).map(f => (
                    <button key={f} onClick={() => { setReqFilter(f); setTimeout(loadRequests, 0); }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${reqFilter === f ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <input value={reqPath} onChange={e => setReqPath(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadRequests()}
                  placeholder="Filter by path…" className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <button onClick={loadRequests} className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Search</button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-800">
                    {["Time","Method","Path","Status","Duration","User",""].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-medium text-neutral-500">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">No requests yet — they appear as you use the API</td></tr>
                    ) : requests.map(r => (
                      <>
                        <tr key={r.id} className={`border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors cursor-pointer ${expandedReq === r.id ? "bg-neutral-800/30" : ""}`}
                          onClick={() => setExpandedReq(expandedReq === r.id ? null : r.id)}>
                          <td className="px-3 py-2.5"><RelTime iso={r.created_at} /></td>
                          <td className="px-3 py-2.5"><span className="text-xs font-mono text-neutral-400">{r.method}</span></td>
                          <td className="px-3 py-2.5 font-mono text-xs text-white max-w-48 truncate">{r.path}</td>
                          <td className="px-3 py-2.5"><StatusBadge code={r.status_code} /></td>
                          <td className="px-3 py-2.5 text-xs tabular-nums text-neutral-400">{r.duration_ms}ms</td>
                          <td className="px-3 py-2.5 text-xs text-neutral-500">{r.user_role ?? "anon"}</td>
                          <td className="px-3 py-2.5 text-xs text-indigo-500">{expandedReq === r.id ? "▲" : "▼"}</td>
                        </tr>
                        {expandedReq === r.id && (
                          <tr key={`${r.id}-detail`} className="bg-neutral-800/20 border-b border-neutral-800">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                                <div><span className="text-neutral-500">IP: </span><span className="text-neutral-300">{r.ip_address ?? "—"}</span></div>
                                <div><span className="text-neutral-500">User agent: </span><span className="text-neutral-300 truncate">{r.user_agent?.slice(0, 60) ?? "—"}</span></div>
                                {r.error_msg && <div><span className="text-neutral-500">Error: </span><span className="text-red-400">{r.error_msg}</span></div>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-600 mt-2">Showing up to 100 of {reqTotal} matching requests</p>
            </div>
          )}

          {/* ─── ERRORS ─── */}
          {tab === "errors" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                  {[["Active", false], ["Resolved", true]].map(([label, val]) => (
                    <button key={String(val)} onClick={() => setErrResolved(val as boolean)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${errResolved === val ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
                      {label as string} ({val ? errors.filter(e => e.resolved).length : errors.filter(e => !e.resolved).length})
                    </button>
                  ))}
                </div>
                {errResolved && errors.length > 0 && (
                  <button onClick={() => clearResolvedErrors().then(loadErrors)}
                    className="text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 transition-colors">
                    Clear all resolved
                  </button>
                )}
              </div>

              {errors.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-emerald-400 text-sm">✓ No {errResolved ? "resolved" : "active"} errors</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.map(e => (
                    <div key={e.id} className={`bg-neutral-900 border rounded-xl p-4 ${e.resolved ? "border-neutral-800 opacity-60" : "border-red-900/40"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded font-bold">×{e.occurrence_count}</span>
                            {e.status_code && <span className="text-xs text-neutral-500">{e.status_code}</span>}
                            {e.code && <span className="text-xs font-mono text-neutral-600">{e.code}</span>}
                          </div>
                          <p className="text-sm text-red-300 font-medium mb-1">{e.message}</p>
                          {e.path && <p className="text-xs font-mono text-neutral-500">{e.method} {e.path}</p>}
                          <div className="flex gap-3 mt-1 text-xs text-neutral-600">
                            <span>First: <RelTime iso={e.first_seen} /></span>
                            <span>Last: <RelTime iso={e.last_seen} /></span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setExpandedErr(expandedErr === e.id ? null : e.id)}
                            className="text-xs px-2 py-1.5 rounded-md bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors">
                            {expandedErr === e.id ? "Hide" : "Stack"}
                          </button>
                          <button onClick={() => handleResolve(e.id, !e.resolved)} disabled={resolving === e.id}
                            className={`text-xs px-3 py-1.5 rounded-md disabled:opacity-40 transition-colors ${e.resolved ? "bg-neutral-800 text-neutral-400 hover:bg-neutral-700" : "bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-900"}`}>
                            {resolving === e.id ? "…" : e.resolved ? "Reopen" : "Resolve"}
                          </button>
                          <button onClick={() => handleDeleteError(e.id)}
                            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-500 hover:bg-neutral-700 transition-colors">✕</button>
                        </div>
                      </div>
                      {expandedErr === e.id && e.stack && (
                        <pre className="text-xs font-mono text-neutral-500 bg-neutral-800 rounded-lg p-3 overflow-x-auto mt-2 max-h-48 overflow-y-auto">
                          {e.stack}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── PERFORMANCE ─── */}
          {tab === "performance" && metrics && (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <StatCard label="Requests/min"  value={metrics.realtime.requests_1m} />
                <StatCard label="p50 latency"   value={`${metrics.realtime.p50_ms}ms`} />
                <StatCard label="p95 latency"   value={`${metrics.realtime.p95_ms}ms`} color={metrics.realtime.p95_ms > 500 ? "text-yellow-400" : "text-white"} />
                <StatCard label="Error rate"    value={`${metrics.realtime.error_rate}%`} color={parseFloat(metrics.realtime.error_rate) > 5 ? "text-red-400" : "text-emerald-400"} />
              </div>

              {/* Snapshot history charts */}
              {metrics.snapshots.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <MiniBarChart data={metrics.snapshots.map(s => s.req_count)} color="bg-indigo-500" label="Request rate (1h history)" />
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <MiniBarChart data={metrics.snapshots.map(s => s.p95_ms)} color="bg-yellow-500" label="p95 latency ms (1h history)" />
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <MiniBarChart data={metrics.snapshots.map(s => s.err_count)} color="bg-red-500" label="Error count (1h history)" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Slowest endpoints */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-800"><h2 className="text-xs font-semibold text-neutral-400">Slowest Endpoints (last hour)</h2></div>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-neutral-800">
                      {["Path","Avg","p95","Calls"].map(h => <th key={h} className="text-left px-3 py-2 text-neutral-600 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {metrics.slow_endpoints.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-neutral-600">No data</td></tr>
                      ) : metrics.slow_endpoints.map(e => (
                        <tr key={e.path} className="border-b border-neutral-800/40">
                          <td className="px-3 py-2 font-mono text-white truncate max-w-32">{e.path}</td>
                          <td className={`px-3 py-2 tabular-nums ${e.avg_ms > 300 ? "text-yellow-400" : "text-neutral-300"}`}>{e.avg_ms}ms</td>
                          <td className={`px-3 py-2 tabular-nums ${e.p95_ms > 500 ? "text-red-400" : "text-neutral-400"}`}>{e.p95_ms}ms</td>
                          <td className="px-3 py-2 tabular-nums text-neutral-500">{e.req_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Busiest endpoints */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-800"><h2 className="text-xs font-semibold text-neutral-400">Busiest Endpoints (last hour)</h2></div>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-neutral-800">
                      {["Path","Calls","Avg","Errors"].map(h => <th key={h} className="text-left px-3 py-2 text-neutral-600 font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {metrics.busy_endpoints.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-4 text-center text-neutral-600">No data</td></tr>
                      ) : metrics.busy_endpoints.map(e => (
                        <tr key={e.path} className="border-b border-neutral-800/40">
                          <td className="px-3 py-2 font-mono text-white truncate max-w-32">{e.path}</td>
                          <td className="px-3 py-2 tabular-nums text-white">{e.req_count}</td>
                          <td className="px-3 py-2 tabular-nums text-neutral-400">{e.avg_ms}ms</td>
                          <td className={`px-3 py-2 tabular-nums ${e.error_count > 0 ? "text-red-400" : "text-neutral-600"}`}>{e.error_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── EVENTS ─── */}
          {tab === "events" && (
            <div>
              <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit mb-4">
                {["all","success","failed","retrying"].map(s => (
                  <button key={s} onClick={() => { setEvtFilter(s); setTimeout(loadEvents, 0); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${evtFilter === s ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-neutral-800">
                    {["Time","Workflow","Trigger","Action","Status","Duration"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500 text-sm">No events yet</td></tr>
                    ) : events.map(e => (
                      <tr key={e.id} className="border-b border-neutral-800/50">
                        <td className="px-4 py-2.5"><RelTime iso={e.created_at} /></td>
                        <td className="px-4 py-2.5 text-white text-xs truncate max-w-32">{e.workflow_name}</td>
                        <td className="px-4 py-2.5 text-neutral-400 text-xs">{e.trigger_type}</td>
                        <td className="px-4 py-2.5 text-neutral-400 text-xs">{e.action_type}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium capitalize ${STATUS_EVT_COLOR[e.status] ?? "text-neutral-400"}`}>{e.status}</span>
                          {e.error && <p className="text-xs text-red-400 truncate max-w-32">{e.error}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500 text-xs tabular-nums">{e.duration_ms != null ? `${e.duration_ms}ms` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
