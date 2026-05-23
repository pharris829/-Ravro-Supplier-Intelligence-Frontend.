"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getScoringSummary, getScoringDistributions, getScoringConfig, runScoring, type ScoringSummary, type ScoreBucket, type ScoringConfig } from "@/lib/api";

const MODELS = [
  { key: "demand",        href: "/admin/scoring/demand",        label: "Demand Score",        color: "var(--blue)",  desc: "Category signals, price accessibility, stock pressure"        },
  { key: "saturation",    href: "/admin/scoring/saturation",    label: "Saturation Score",    color: "var(--amber)", desc: "Market competition by category product count"                  },
  { key: "reliability",   href: "/admin/scoring/reliability",   label: "Supplier Reliability", color: "var(--mint)",  desc: "Blended trust and reliability from supplier profile"          },
  { key: "profitability", href: "/admin/scoring/profitability", label: "Profitability Score",  color: "#a855f7",      desc: "Price tier × demand × market position"                        },
];

function MiniBar({ buckets, color }: { buckets: ScoreBucket[]; color: string }) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28 }}>
      {buckets.map(b => (
        <div key={b.bucket} style={{ flex: 1, background: color, borderRadius: 2, opacity: 0.65, height: `${Math.max(4, (b.count / max) * 28)}px` }} />
      ))}
    </div>
  );
}

export default function ScoringPage() {
  const [summary,    setSummary]    = useState<ScoringSummary | null>(null);
  const [dists,      setDists]      = useState<Record<string, ScoreBucket[]>>({});
  const [weights,    setWeights]    = useState<Record<string, number>>({ weight_demand: 0.35, weight_saturation: 0.25, weight_reliability: 0.20, weight_profitability: 0.20 });
  const [running,    setRunning]    = useState(false);
  const [runResult,  setRunResult]  = useState<string | null>(null);

  useEffect(() => {
    getScoringSummary().then(r => setSummary(r.summary)).catch(() => {});
    getScoringDistributions().then(setDists).catch(() => {});
    getScoringConfig().then(r => {
      const w: Record<string, number> = {};
      r.configs.filter((c: ScoringConfig) => c.group_name === "composite").forEach((c: ScoringConfig) => { w[c.key] = c.value; });
      if (Object.keys(w).length) setWeights(prev => ({ ...prev, ...w }));
    }).catch(() => {});
  }, []);

  async function handleRun() {
    setRunning(true); setRunResult(null);
    try {
      const r = await runScoring();
      setRunResult(r.message);
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
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ADMIN</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Scoring Models</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
            {summary?.last_scored_at ? `Last run: ${new Date(summary.last_scored_at).toLocaleString()}` : "No scoring run yet"}
          </p>
        </div>
        <button onClick={handleRun} disabled={running} style={{ background: "var(--red)", color: "#fff", border: "none", borderRadius: 4, padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: running ? 0.6 : 1 }}>
          {running ? "Running…" : "▶ Run All Models"}
        </button>
      </div>

      {runResult && (
        <div style={{ background: "rgba(0,245,196,0.06)", border: "1px solid rgba(0,245,196,0.25)", borderRadius: 4, padding: "10px 14px", fontSize: 11, color: "var(--mint)", marginBottom: 18 }}>
          ✓ {runResult}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        {[
          { label: "Products Scored",   value: summary?.match_scored ?? "—" },
          { label: "Avg Demand",        value: summary?.avg_demand       ? (+summary.avg_demand).toFixed(2)       : "—" },
          { label: "Avg Profitability", value: summary?.avg_profitability ? (+summary.avg_profitability).toFixed(2): "—" },
          { label: "Avg Match Score",   value: summary?.avg_match        ? (+summary.avg_match).toFixed(2)        : "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {MODELS.map(m => (
          <Link key={m.key} href={m.href} style={{
            display: "block", background: "var(--surface2)",
            border: `1px solid ${m.color}30`, borderRadius: 4, padding: "16px 18px",
            textDecoration: "none", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}60`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}30`; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: m.color, margin: 0, marginBottom: 3 }}>{m.label}</h2>
                <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>{m.desc}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>avg</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1 }}>{avgMap[m.key]?.toFixed(2) ?? "—"}</p>
              </div>
            </div>
            {dists[m.key] && <MiniBar buckets={dists[m.key]} color={m.color} />}
            <p style={{ fontSize: 9, color: m.color, marginTop: 10, margin: "10px 0 0" }}>Configure model →</p>
          </Link>
        ))}
      </div>

      {/* Composition */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
        <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">MATCH SCORE COMPOSITION</div>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 12 }}>
          match_score = demand×w₁ + (1−saturation)×w₂ + reliability×w₃ + profitability×w₄
        </p>
        {(() => {
          const bars = [
            { key: "weight_demand",        label: "Demand",        color: "var(--blue)"  },
            { key: "weight_saturation",    label: "Saturation",    color: "var(--amber)" },
            { key: "weight_reliability",   label: "Reliability",   color: "var(--mint)"  },
            { key: "weight_profitability", label: "Profitability", color: "#a855f7"       },
          ];
          return (
            <>
              <div style={{ height: 10, borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 10 }}>
                {bars.map(({ key, color }) => (
                  <div key={key} style={{ width: `${(weights[key] ?? 0) * 100}%`, background: color }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {bars.map(({ key, label, color }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>{label} {Math.round((weights[key] ?? 0) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
