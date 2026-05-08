"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getRecommendations, type RecommendationProduct, type NicheRecommendation, type RecommendationsPayload } from "@/lib/api";

// ─── Score badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ value, label }: { value?: number; label: string }) {
  if (value == null) return null;
  const color = value >= 0.75 ? "text-emerald-400 bg-emerald-950 border-emerald-900"
              : value >= 0.45 ? "text-yellow-400 bg-yellow-950 border-yellow-900"
              : "text-red-400 bg-red-950 border-red-900";
  return (
    <div className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border ${color}`}>
      <span className="text-xs font-bold tabular-nums">{value.toFixed(2)}</span>
      <span className="text-xs opacity-70" style={{ fontSize: 10 }}>{label}</span>
    </div>
  );
}

// ─── Opportunity card ─────────────────────────────────────────────────────────
function OpportunityCard({ p }: { p: RecommendationProduct }) {
  const tier = (p.match_score ?? 0) >= 0.75 ? "high" : (p.match_score ?? 0) >= 0.45 ? "medium" : "low";
  const tierColor = { high: "border-emerald-800", medium: "border-yellow-800", low: "border-neutral-700" }[tier];

  return (
    <Link href={`/products/${p.id}`}
      className={`block bg-neutral-900 border ${tierColor} hover:border-indigo-600 rounded-xl p-4 transition-colors group`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <p className="text-sm font-semibold text-white group-hover:text-indigo-400 leading-tight">{p.product_name}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{p.category} · {p.supplier_name ?? "Unknown supplier"}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
          tier === "high"   ? "bg-emerald-950 text-emerald-400 border-emerald-900" :
          tier === "medium" ? "bg-yellow-950 text-yellow-400 border-yellow-900" :
                              "bg-neutral-800 text-neutral-400 border-neutral-700"
        }`}>{tier}</span>
      </div>

      {/* Score pills */}
      <div className="flex gap-2 mb-3">
        <ScoreBadge value={p.match_score}         label="Match"   />
        <ScoreBadge value={p.demand_score}         label="Demand"  />
        <ScoreBadge value={p.saturation_score}     label="Sat"     />
        <ScoreBadge value={p.profitability_score}  label="Profit"  />
      </div>

      {/* Why */}
      {p.why && (
        <p className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 rounded-lg px-2.5 py-1.5">
          {p.why}
        </p>
      )}

      {p.price != null && (
        <p className="text-xs text-neutral-600 mt-2">${p.price.toFixed(2)}</p>
      )}
    </Link>
  );
}

// ─── Trending row ─────────────────────────────────────────────────────────────
function TrendingRow({ p, rank }: { p: RecommendationProduct; rank: number }) {
  const delta = p.score_delta ?? 0;
  const pct   = p.pct_change  ?? 0;

  return (
    <Link href={`/products/${p.id}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-800/30 transition-colors group border-b border-neutral-800/50 last:border-0">
      <span className="text-sm font-bold text-neutral-600 w-5 shrink-0">#{rank}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white group-hover:text-indigo-400 truncate">{p.product_name}</p>
        <p className="text-xs text-neutral-500 truncate">{p.category} · {p.supplier_name}</p>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-xs text-neutral-500 tabular-nums">
            {(p.prev_score ?? 0).toFixed(2)} → <span className="text-white">{(p.current_score ?? p.match_score ?? 0).toFixed(2)}</span>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-emerald-400">▲ +{delta.toFixed(3)}</span>
          <span className="text-xs text-emerald-500 opacity-70">+{pct}%</span>
        </div>

        {/* Spark bar */}
        <div className="flex items-end gap-0.5 h-6 w-10">
          {[0.6, 0.7, 0.8, 0.9, 1.0].map((f, i) => {
            const h = Math.max(4, f * 24);
            return (
              <div key={i} className={`flex-1 rounded-sm ${i === 4 ? "bg-emerald-400" : "bg-neutral-700"}`}
                style={{ height: `${h}px` }} />
            );
          })}
        </div>
      </div>
    </Link>
  );
}

// ─── Niche card ───────────────────────────────────────────────────────────────
function NicheCard({ niche }: { niche: NicheRecommendation }) {
  const tierColor = {
    high:   { border: "border-emerald-800", badge: "bg-emerald-950 text-emerald-400 border-emerald-900", bar: "bg-emerald-500" },
    medium: { border: "border-yellow-800",  badge: "bg-yellow-950 text-yellow-400 border-yellow-900",   bar: "bg-yellow-500"  },
    low:    { border: "border-neutral-700", badge: "bg-neutral-800 text-neutral-400 border-neutral-700", bar: "bg-neutral-600" },
  }[niche.tier];

  return (
    <div className={`bg-neutral-900 border ${tierColor.border} rounded-xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{niche.category}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{niche.product_count} products</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border capitalize ${tierColor.badge}`}>
          {niche.tier} opportunity
        </span>
      </div>

      {/* Opportunity gap bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-neutral-500">Opportunity gap</span>
          <span className="text-white font-medium">{niche.opportunity_gap.toFixed(2)}</span>
        </div>
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className={`h-full ${tierColor.bar} rounded-full`}
            style={{ width: `${Math.min(niche.opportunity_gap * 200, 100)}%` }} />
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Demand",      value: niche.avg_demand,      color: "text-blue-400"   },
          { label: "Saturation",  value: niche.avg_saturation,  color: "text-orange-400" },
          { label: "Avg Match",   value: niche.avg_match,       color: "text-white"      },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-neutral-800 rounded-lg p-2 text-center">
            <p className={`text-sm font-semibold tabular-nums ${color}`}>{value.toFixed(2)}</p>
            <p className="text-xs text-neutral-600">{label}</p>
          </div>
        ))}
      </div>

      {niche.top_product && (
        <p className="text-xs text-neutral-500">
          Top: <span className="text-neutral-300">{niche.top_product}</span>
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const [data,      setData]      = useState<RecommendationsPayload | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"opportunities" | "trending" | "niches">("opportunities");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      setData(await getRecommendations());
    } catch { /* ignore */ } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { key: "opportunities", label: "Top Opportunities",       count: data?.opportunities.length },
    { key: "trending",      label: "Trending Upward",         count: data?.trending.length      },
    { key: "niches",        label: "Low-Competition Niches",  count: data?.niches.length        },
  ] as const;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Recommendations</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {data?.generated_at
              ? `Updated ${new Date(data.generated_at).toLocaleTimeString()}`
              : "Personalized product intelligence"}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="text-sm px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"
            }`}>
            {t.label}
            {t.count != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-indigo-500" : "bg-neutral-800"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ─── Top Opportunities ─── */}
          {activeTab === "opportunities" && (
            <div>
              <p className="text-xs text-neutral-500 mb-4">
                Highest-scoring products scored in the last 7 days — sorted by opportunity match.
              </p>
              {(data?.opportunities.length ?? 0) === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-neutral-400 text-sm">No scored products yet.</p>
                  <p className="text-neutral-600 text-xs mt-1">Run the scoring pipeline from Admin → Scoring Models.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {data?.opportunities.map(p => <OpportunityCard key={p.id} p={p} />)}
                </div>
              )}
            </div>
          )}

          {/* ─── Trending ─── */}
          {activeTab === "trending" && (
            <div>
              <p className="text-xs text-neutral-500 mb-4">
                Products whose opportunity score has increased since the last scoring run.
              </p>
              {(data?.trending.length ?? 0) === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-neutral-400 text-sm">No trending products yet.</p>
                  <p className="text-neutral-600 text-xs mt-1">Run scoring at least twice to detect score changes.</p>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  {data?.trending.map((p, i) => <TrendingRow key={p.id} p={p} rank={i + 1} />)}
                </div>
              )}
            </div>
          )}

          {/* ─── Niches ─── */}
          {activeTab === "niches" && (
            <div>
              <p className="text-xs text-neutral-500 mb-4">
                Categories with high demand but low market saturation — the best places to source new products.
              </p>
              {(data?.niches.length ?? 0) === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-neutral-400 text-sm">No niche data yet.</p>
                  <p className="text-neutral-600 text-xs mt-1">Ingest products across multiple categories to see niche analysis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {data?.niches.map(n => <NicheCard key={n.category} niche={n} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
