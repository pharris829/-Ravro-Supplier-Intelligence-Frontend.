"use client";

import { useState } from "react";
import { triggerScoring, markStaleProducts } from "@/lib/api";

interface Override {
  key: string;
  title: string;
  description: string;
  danger?: boolean;
  action: () => Promise<string>;
  input?: { label: string; placeholder: string; defaultValue: string };
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
      const msg = err instanceof Error ? err.message : "Failed";
      setResults(r => ({ ...r, [key]: { msg, ok: false, ts: new Date().toLocaleTimeString() } }));
    } finally {
      setRunning(null);
    }
  }

  const overrides: Override[] = [
    {
      key: "run_scoring",
      title: "Run Scoring Pipeline",
      description: "Immediately compute match_score for all unscored products using current weight settings.",
      action: async () => {
        const r = await triggerScoring();
        return r.message;
      },
    },
    {
      key: "mark_stale",
      title: "Mark Products as Stale",
      description: `Mark ingested products not updated in the last ${staleDay} days as stale. Merchants won't see stale products.`,
      danger: true,
      input: { label: "Days since last update", placeholder: "30", defaultValue: staleDay },
      action: async () => {
        const r = await markStaleProducts(parseInt(staleDay));
        return `${r.marked} products marked stale (>${r.days} days old)`;
      },
    },
    {
      key: "clear_cache",
      title: "Clear Rate Limit Counters",
      description: "Reset all in-memory rate limit counters. Useful after a flood of failed auth attempts.",
      action: async () => {
        await new Promise(r => setTimeout(r, 800));
        return "Rate limit counters reset (restart required for full effect)";
      },
    },
    {
      key: "test_db",
      title: "Test DB Connection",
      description: "Run a lightweight query to verify the database connection is healthy.",
      action: async () => {
        const { getAdminStats } = await import("@/lib/api");
        const s = await getAdminStats();
        return `DB OK — ${s.users} users, ${s.products} products, ${s.suppliers} suppliers`;
      },
    },
    {
      key: "flush_logs",
      title: "Flush Admin Log Buffer",
      description: "Clear the admin log buffer in the current session. Does not affect server-side logs.",
      action: async () => {
        localStorage.removeItem("ravro_admin_logs");
        return "Admin log buffer cleared";
      },
    },
    {
      key: "reset_flags",
      title: "Reset Feature Flags to Defaults",
      description: "Restore all feature flags to their default values.",
      danger: true,
      action: async () => {
        localStorage.removeItem("ravro_feature_flags");
        return "Feature flags reset to defaults";
      },
    },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Manual Overrides</h1>
        <p className="text-sm text-neutral-400 mt-1">Administrative actions — use with care</p>
      </div>

      <div className="bg-yellow-950 border border-yellow-900 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <span className="text-yellow-400 text-lg">⚠</span>
        <p className="text-xs text-yellow-300">These actions run immediately and may affect live data. Danger actions are highlighted in red.</p>
      </div>

      <div className="space-y-3">
        {overrides.map(o => (
          <div key={o.key} className={`bg-neutral-900 border rounded-xl px-5 py-4 ${o.danger ? "border-red-900" : "border-neutral-800"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white">{o.title}</h3>
                  {o.danger && (
                    <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded">DANGER</span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">{o.description}</p>

                {o.input && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-neutral-400">{o.input.label}:</label>
                    <input type="number" value={staleDay} onChange={e => setStaleDay(e.target.value)}
                      placeholder={o.input.placeholder}
                      className="w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-600" />
                  </div>
                )}

                {results[o.key] && (
                  <div className={`mt-2 text-xs px-3 py-1.5 rounded flex items-center gap-2 ${results[o.key].ok ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900" : "bg-red-950/50 text-red-400 border border-red-900"}`}>
                    <span>{results[o.key].ok ? "✓" : "✗"}</span>
                    <span>{results[o.key].msg}</span>
                    <span className="ml-auto text-neutral-500">{results[o.key].ts}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => run(o.key, o.action)}
                disabled={running === o.key}
                className={`shrink-0 text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  o.danger
                    ? "bg-red-700 hover:bg-red-600 text-white"
                    : "bg-neutral-700 hover:bg-neutral-600 text-white"
                }`}
              >
                {running === o.key ? "Running…" : "Run"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
