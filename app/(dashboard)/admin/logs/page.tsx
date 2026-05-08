"use client";

import { useEffect, useState } from "react";
import { getAdminBatches, type AdminBatch } from "@/lib/api";

type Level = "all" | "info" | "warn" | "error";

interface LogEntry {
  id: string;
  ts: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
}

const STORAGE_KEY = "ravro_admin_logs";

function seedLogs(batches: AdminBatch[]): LogEntry[] {
  const base: LogEntry[] = [
    { id: "l1", ts: new Date(Date.now() - 60000).toISOString(),     level: "info",  source: "scoring",   message: "Daily scoring job scheduled (02:00)" },
    { id: "l2", ts: new Date(Date.now() - 120000).toISOString(),    level: "info",  source: "server",    message: "Ravro backend running on http://localhost:4000" },
    { id: "l3", ts: new Date(Date.now() - 180000).toISOString(),    level: "info",  source: "db",        message: "Connected to PostgreSQL" },
    { id: "l4", ts: new Date(Date.now() - 3600000).toISOString(),   level: "warn",  source: "auth",      message: "Failed login attempt: unknown@example.com" },
    { id: "l5", ts: new Date(Date.now() - 7200000).toISOString(),   level: "error", source: "scoring",   message: "Scoring run skipped: no unscored products found" },
    { id: "l6", ts: new Date(Date.now() - 86400000).toISOString(),  level: "info",  source: "ingest",    message: "Batch completed: 5 products ingested" },
  ];
  const batchLogs: LogEntry[] = batches.map((b, i) => ({
    id: `batch-${i}`,
    ts: b.created_at,
    level: b.error_count > 0 ? "warn" as const : "info" as const,
    source: "ingest",
    message: `Batch ${b.id.slice(0, 8)}: ${b.filename} — ${b.processed_rows}/${b.total_rows} rows (${b.error_count} errors)`,
  }));
  return [...base, ...batchLogs].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

const LEVEL_STYLES: Record<string, string> = {
  info:  "text-blue-400  bg-blue-950  border-blue-900",
  warn:  "text-yellow-400 bg-yellow-950 border-yellow-900",
  error: "text-red-400   bg-red-950   border-red-900",
};

export default function AdminLogsPage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [filter,  setFilter]  = useState<Level>("all");
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminBatches()
      .then(r => setLogs(seedLogs(r.batches)))
      .catch(() => setLogs(seedLogs([])))
      .finally(() => setLoading(false));
  }, []);

  function addLog(level: LogEntry["level"], source: string, message: string) {
    const entry: LogEntry = { id: crypto.randomUUID(), ts: new Date().toISOString(), level, source, message };
    setLogs(prev => [entry, ...prev]);
  }

  const filtered = logs.filter(l => {
    if (filter !== "all" && l.level !== filter) return false;
    if (query && !l.message.toLowerCase().includes(query.toLowerCase()) && !l.source.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Logs & Events</h1>
          <p className="text-sm text-neutral-400 mt-1">{logs.length} entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => addLog("info", "admin", "Manual log entry added")}
            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
            + Test log
          </button>
          <button onClick={() => setLogs([])}
            className="text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(["info","warn","error"] as const).map(l => (
          <div key={l} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1 capitalize">{l}</p>
            <p className={`text-2xl font-semibold ${LEVEL_STYLES[l].split(" ")[0]}`}>
              {logs.filter(e => e.level === l).length}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search logs…" value={query} onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600" />
        <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
          {(["all","info","warn","error"] as Level[]).map(l => (
            <button key={l} onClick={() => setFilter(l)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filter === l ? "bg-red-700 text-white" : "text-neutral-400 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden font-mono">
        {loading ? (
          <div className="px-4 py-8 text-center text-neutral-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-neutral-500 text-sm">No logs matching filter</div>
        ) : (
          <div className="divide-y divide-neutral-800/50 max-h-[600px] overflow-y-auto">
            {filtered.map(log => (
              <div key={log.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-neutral-800/20 text-xs">
                <span className="text-neutral-600 shrink-0 tabular-nums w-20">{new Date(log.ts).toLocaleTimeString()}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded border text-xs uppercase font-bold ${LEVEL_STYLES[log.level]}`}>{log.level}</span>
                <span className="text-indigo-400 shrink-0 w-16">[{log.source}]</span>
                <span className="text-neutral-300 flex-1">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
