"use client";

import { useState } from "react";
import { triggerScoring, markStaleProducts, getAdminStats, resetRateLimits, resetAdminFlags } from "@/lib/api";
import { setFlagsCache } from "@/lib/flags";

interface Override {
  key: string;
  title: string;
  description: string;
  danger?: boolean;
  action: () => Promise<string>;
  input?: { label: string; placeholder: string };
}

export default function AdminOverridesPage() {
  const [running,  setRunning]  = useState<string | null>(null);
  const [results,  setResults]  = useState<Record<string, { msg: string; ok: boolean; ts: string }>>({});
  const [staleDay, setStaleDay] = useState("30");

  async function run(key: string, action: () => Promise<string>) {
    setRunning(key);
    try {
      const msg = await action();
      setResults(r => ({ ...r, [key]: { msg, ok: true, ts: new Date().toLocaleTimeString() } }));
    } catch (err: unknown) {
      setResults(r => ({ ...r, [key]: { msg: err instanceof Error ? err.message : "Failed", ok: false, ts: new Date().toLocaleTimeString() } }));
    } finally { setRunning(null); }
  }

  const overrides: Override[] = [
    { key: "run_scoring",  title: "Run Scoring Pipeline",         description: "Immediately compute match_score for all unscored products using current weight settings.", action: async () => { const r = await triggerScoring(); return r.message; } },
    { key: "mark_stale",   title: "Mark Products as Stale",       description: `Mark ingested products not updated in the last ${staleDay} days as stale.`, danger: true, input: { label: "Days since last update", placeholder: "30" }, action: async () => { const r = await markStaleProducts(parseInt(staleDay)); return `${r.marked} products marked stale (>${r.days} days old)`; } },
    { key: "clear_cache",  title: "Clear Rate Limit Counters",    description: "Reset all in-memory rate limit counters. Useful after a flood of failed auth attempts.", action: async () => { const r = await resetRateLimits(); return r.message; } },
    { key: "test_db",      title: "Test DB Connection",           description: "Run a lightweight query to verify the database connection is healthy.", action: async () => { const s = await getAdminStats(); return `DB OK — ${s.users} users, ${s.products} products, ${s.suppliers} suppliers`; } },
    { key: "flush_logs",   title: "Flush Admin Log Buffer",       description: "Clear the admin log buffer in the current session.", action: async () => { localStorage.removeItem("ravro_admin_logs"); return "Admin log buffer cleared"; } },
    { key: "reset_flags",  title: "Reset Feature Flags to Defaults", description: "Restore all feature flags to their default values.", danger: true, action: async () => { const r = await resetAdminFlags(); localStorage.removeItem("ravro_feature_flags"); setFlagsCache({}); return r.message; } },
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ADMIN</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Manual Overrides</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Administrative actions — use with care</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 4, marginBottom: 20, background: "rgba(255,184,77,0.06)", border: "1px solid rgba(255,184,77,0.25)" }}>
        <span style={{ color: "var(--amber)", fontSize: 14, flexShrink: 0 }}>⚠</span>
        <p style={{ fontSize: 10, color: "var(--amber)", margin: 0 }}>These actions run immediately and may affect live data. Danger actions are highlighted in red.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {overrides.map(o => (
          <div key={o.key} style={{ background: "var(--surface2)", border: `1px solid ${o.danger ? "rgba(255,75,110,0.3)" : "var(--border)"}`, borderRadius: 4, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{o.title}</h3>
                  {o.danger && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 2, background: "rgba(255,75,110,0.08)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.25)", letterSpacing: 0.5 }} className="font-orbitron">DANGER</span>}
                </div>
                <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0, marginBottom: o.input ? 10 : 0 }}>{o.description}</p>
                {o.input && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 9, color: "var(--text-secondary)" }}>{o.input.label}:</label>
                    <input type="number" value={staleDay} onChange={e => setStaleDay(e.target.value)} placeholder={o.input.placeholder}
                      style={{ width: 60, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--text-primary)", outline: "none" }} />
                  </div>
                )}
                {results[o.key] && (
                  <div style={{ marginTop: 10, fontSize: 10, padding: "6px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 6, background: results[o.key].ok ? "rgba(0,245,196,0.06)" : "rgba(255,75,110,0.06)", border: `1px solid ${results[o.key].ok ? "rgba(0,245,196,0.25)" : "rgba(255,75,110,0.25)"}`, color: results[o.key].ok ? "var(--mint)" : "var(--red)" }}>
                    <span>{results[o.key].ok ? "✓" : "✗"}</span>
                    <span style={{ flex: 1 }}>{results[o.key].msg}</span>
                    <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{results[o.key].ts}</span>
                  </div>
                )}
              </div>
              <button onClick={() => run(o.key, o.action)} disabled={running === o.key} style={{
                flexShrink: 0, fontSize: 10, fontWeight: 600, padding: "7px 16px", borderRadius: 4, cursor: "pointer",
                opacity: running === o.key ? 0.6 : 1, border: "none",
                background: o.danger ? "var(--red)" : "var(--surface3)",
                color: o.danger ? "var(--obsidian)" : "var(--text-secondary)",
              }}>
                {running === o.key ? "Running…" : "Run"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
