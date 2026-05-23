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
    { id: "l1", ts: new Date(Date.now() - 60000).toISOString(),    level: "info",  source: "scoring", message: "Daily scoring job scheduled (02:00)" },
    { id: "l2", ts: new Date(Date.now() - 120000).toISOString(),   level: "info",  source: "server",  message: "Ravro backend running on http://localhost:4000" },
    { id: "l3", ts: new Date(Date.now() - 180000).toISOString(),   level: "info",  source: "db",      message: "Connected to PostgreSQL" },
    { id: "l4", ts: new Date(Date.now() - 3600000).toISOString(),  level: "warn",  source: "auth",    message: "Failed login attempt: unknown@example.com" },
    { id: "l5", ts: new Date(Date.now() - 7200000).toISOString(),  level: "error", source: "scoring", message: "Scoring run skipped: no unscored products found" },
    { id: "l6", ts: new Date(Date.now() - 86400000).toISOString(), level: "info",  source: "ingest",  message: "Batch completed: 5 products ingested" },
  ];
  const batchLogs: LogEntry[] = batches.map((b, i) => ({
    id: `batch-${i}`, ts: b.created_at,
    level: b.error_count > 0 ? "warn" as const : "info" as const,
    source: "ingest",
    message: `Batch ${b.id.slice(0,8)}: ${b.filename} — ${b.processed_rows}/${b.total_rows} rows (${b.error_count} errors)`,
  }));
  return [...base, ...batchLogs].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

function levelColor(l: string): string {
  return l === "info" ? "var(--blue)" : l === "warn" ? "var(--amber)" : "var(--red)";
}

export default function AdminLogsPage() {
  const [logs,    setLogs]    = useState<LogEntry[]>([]);
  const [filter,  setFilter]  = useState<Level>("all");
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminBatches().then(r => setLogs(seedLogs(r.batches))).catch(() => setLogs(seedLogs([]))).finally(() => setLoading(false));
  }, []);

  function addLog(level: LogEntry["level"], source: string, message: string) {
    setLogs(prev => [{ id: crypto.randomUUID(), ts: new Date().toISOString(), level, source, message }, ...prev]);
  }

  const filtered = logs.filter(l => {
    if (filter !== "all" && l.level !== filter) return false;
    if (query && !l.message.toLowerCase().includes(query.toLowerCase()) && !l.source.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ADMIN</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Logs & Events</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{logs.length} entries</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => addLog("info", "admin", "Manual log entry added")} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>+ Test log</button>
          <button onClick={() => setLogs([])} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 4, background: "rgba(255,75,110,0.08)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.25)", cursor: "pointer" }}>Clear</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        {(["info","warn","error"] as const).map(l => (
          <div key={l} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "12px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4, textTransform: "capitalize" }}>{l}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: levelColor(l), lineHeight: 1 }}>{logs.filter(e => e.level === l).length}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input type="text" placeholder="Search logs…" value={query} onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "var(--text-primary)", outline: "none" }} />
        <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4 }}>
          {(["all","info","warn","error"] as Level[]).map(l => (
            <button key={l} onClick={() => setFilter(l)} style={{
              padding: "4px 10px", borderRadius: 3, fontSize: 10, fontWeight: 500, textTransform: "capitalize", border: "none", cursor: "pointer",
              background: filter === l ? (l === "all" ? "var(--surface3)" : `${levelColor(l)}22`) : "transparent",
              color: filter === l ? (l === "all" ? "var(--text-primary)" : levelColor(l)) : "var(--text-secondary)",
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", fontFamily: "monospace" }}>
        {loading ? (
          <div style={{ padding: "28px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>No logs matching filter</div>
        ) : (
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {filtered.map(log => (
              <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 14px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 9, color: "var(--text-dim)", flexShrink: 0, width: 72 }}>{new Date(log.ts).toLocaleTimeString()}</span>
                <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 2, background: `${levelColor(log.level)}15`, color: levelColor(log.level), border: `1px solid ${levelColor(log.level)}40`, flexShrink: 0, letterSpacing: 0.5 }}>{log.level.toUpperCase()}</span>
                <span style={{ fontSize: 9, color: "var(--mint)", flexShrink: 0, width: 60 }}>[{log.source}]</span>
                <span style={{ fontSize: 10, color: "var(--text-secondary)", flex: 1 }}>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
