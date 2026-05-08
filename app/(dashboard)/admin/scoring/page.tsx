"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getScoringSummary, getScoringDistributions, runScoring, type ScoringSummary, type ScoreBucket } from "@/lib/api";

const MODELS = [
  { key: "demand",        href: "/admin/scoring/demand",        label: "Demand Score",           color: "text-blue-400",   bg: "bg-blue-950",   border: "border-blue-900",   desc: "Category signals, price accessibility, stock pressure" },
  { key: "saturation",    href: "/admin/scoring/saturation",    label: "Saturation Score",        color: "text-orange-400", bg: "bg-orange-950", border: "border-orange-900", desc: "Market competition by category product count" },
  { key: "reliability",   href: "/admin/scoring/reliability",   label: "Supplier Reliability",    color: "text-emerald-400",bg: "bg-emerald-950",border: "border-emerald-900",desc: "Blended trust and reliability from supplier profile" },
  { key: "profitability", href: "/admin/scoring/profitability", label: "Profitability Score",     color: "text-purple-400", bg: "bg-purple-950", border: "border-purple-900", desc: "Price tier × demand × market position" },
];

function MiniBar({ buckets, color }: { buckets: ScoreBucket[]; color: string }) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {buckets.map(b => (
        <div key={b.bucket} className={`flex-1 rounded-sm ${color} opacity-70`}
          style={{ height: `${Math.max(4, (b.count / max) * 32)}px` }} />
      ))}
    </div>
  );
}

export default function ScoringPage() {
  const [summary, setSummary] = useState<ScoringSummary | null>(null);
  const [dists,   setDists]   = useState<Record<string, ScoreBucket[]>>({});
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  useEffect(() => {
    getScoringSummary().then(r => setSummary(r.summary)).catch(() => {});
    getScoringDistributions().then(setDists).catch(() => {});
  }, []);

  async function handleRun() {
    setRunning(true); setRunResult(null);
    try {
      const r = await runScoring();
      setRunResult(r.message);
      // Refresh
      const [s, d] = await Promise.all([getScoringSummary(), getScoringDistributions()]);
      setSummary(s.summary); setDists(d);
    } catch (err: unknown) {
      setRunResult(err instanceof Error ? err.message : "Failed");
    } finally { setRunning(false); }
  }

  const avgMap: Record<string, number | undefined> = {
    demand:        summary?.avg_demand        ? +summary.avg_demand        : undefined,
    saturation:    summary?.avg_saturation    ? +summary.avg_saturation    : undefined,
    profitability: summary?.avg_profitability ? +summary.avg_profitability : undefined,
    match:         summary?.avg_match         ? +summary.avg_match         : undefined,
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Scoring Models</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {summary?.last_scored_at
              ? `Last run: ${new Date(summary.last_scored_at).toLocaleString()}`
              : "No scoring run yet"}
          </p>
        </div>
        <button onClick={handleRun} disabled={running}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          {running ? "Running…" : "▶ Run All Models"}
        </button>
      </div>

      {runResult && (
        <div className="bg-emerald-950/50 border border-emerald-900 text-emerald-400 text-sm px-4 py-3 rounded-lg mb-5">
          ✓ {runResult}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: "Products Scored", value: summary?.match_scored ?? "—" },
          { label: "Avg Demand",       value: summary?.avg_demand       ? (+summary.avg_demand).toFixed(2)       : "—" },
          { label: "Avg Profitability",value: summary?.avg_profitability ? (+summary.avg_profitability).toFixed(2): "—" },
          { label: "Avg Match Score",  value: summary?.avg_match        ? (+summary.avg_match).toFixed(2)        : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-2 gap-4">
        {MODELS.map(m => (
          <Link key={m.key} href={m.href}
            className={`bg-neutral-900 border ${m.border} hover:${m.border} rounded-xl p-5 transition-colors group block`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className={`text-sm font-semibold ${m.color} mb-0.5`}>{m.label}</h2>
                <p className="text-xs text-neutral-500">{m.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-600">avg</p>
                <p className={`text-lg font-semibold ${m.color}`}>
                  {avgMap[m.key]?.toFixed(2) ?? "—"}
                </p>
              </div>
            </div>
            {dists[m.key] && (
              <MiniBar buckets={dists[m.key]} color={m.bg.replace("bg-", "bg-")} />
            )}
            <p className={`text-xs mt-3 ${m.color} group-hover:underline`}>Configure model →</p>
          </Link>
        ))}
      </div>

      {/* Weight composition */}
      <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Match Score Composition</h2>
        <p className="text-xs text-neutral-500 mb-4">
          match_score = demand×w₁ + (1−saturation)×w₂ + reliability×w₃ + profitability×w₄
        </p>
        <div className="flex h-3 rounded-full overflow-hidden">
          {[
            { label: "Demand 35%",        w: 35, color: "bg-blue-500"   },
            { label: "Saturation 25%",    w: 25, color: "bg-orange-500" },
            { label: "Reliability 20%",   w: 20, color: "bg-emerald-500"},
            { label: "Profitability 20%", w: 20, color: "bg-purple-500" },
          ].map(({ w, color }) => (
            <div key={color} className={`${color}`} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          {[
            { label: "Demand",        color: "bg-blue-500"    },
            { label: "Saturation",    color: "bg-orange-500"  },
            { label: "Reliability",   color: "bg-emerald-500" },
            { label: "Profitability", color: "bg-purple-500"  },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-neutral-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
