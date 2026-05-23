"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getRecommendations, type RecommendationProduct, type NicheRecommendation, type RecommendationsPayload } from "@/lib/api";

function scoreColor(v: number): string {
  return v >= 0.75 ? "var(--mint)" : v >= 0.45 ? "var(--amber)" : "var(--red)";
}

function ScorePill({ value, label }: { value?: number; label: string }) {
  if (value == null) return null;
  const color = scoreColor(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5px 8px", borderRadius: 4, background: `${color}10`, border: `1px solid ${color}30` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{value.toFixed(2)}</span>
      <span style={{ fontSize: 8, color: "var(--text-dim)", marginTop: 1 }}>{label}</span>
    </div>
  );
}

function OpportunityCard({ p }: { p: RecommendationProduct }) {
  const tier = (p.match_score ?? 0) >= 0.75 ? "high" : (p.match_score ?? 0) >= 0.45 ? "medium" : "low";
  const tierColor = { high: "var(--mint)", medium: "var(--amber)", low: "var(--red)" }[tier];
  return (
    <Link href={`/products/${p.id}`} style={{
      display: "block", background: "var(--surface2)", border: `1px solid ${tierColor}25`,
      borderRadius: 4, padding: "14px 16px", textDecoration: "none", transition: "border-color 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${tierColor}25`; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{p.product_name}</p>
          <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "3px 0 0" }}>{p.category} · {p.supplier_name ?? "Unknown supplier"}</p>
        </div>
        <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 2, background: `${tierColor}10`, color: tierColor, border: `1px solid ${tierColor}30`, letterSpacing: 0.5, flexShrink: 0 }}>{tier.toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: p.why ? 8 : 0 }}>
        <ScorePill value={p.match_score}        label="Match"  />
        <ScorePill value={p.demand_score}        label="Demand" />
        <ScorePill value={p.saturation_score}    label="Sat"    />
        <ScorePill value={p.profitability_score} label="Profit" />
      </div>
      {p.why && (
        <p style={{ fontSize: 9, color: "var(--mint)", background: "rgba(0,245,196,0.06)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "5px 8px", margin: 0 }}>{p.why}</p>
      )}
      {p.price != null && <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "6px 0 0" }}>${p.price.toFixed(2)}</p>}
    </Link>
  );
}

function TrendingRow({ p, rank }: { p: RecommendationProduct; rank: number }) {
  const delta = p.score_delta ?? 0;
  const pct   = p.pct_change  ?? 0;
  return (
    <Link href={`/products/${p.id}`} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
      borderBottom: "1px solid var(--border)", textDecoration: "none", transition: "background 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", width: 20, flexShrink: 0 }}>#{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product_name}</p>
        <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.category} · {p.supplier_name}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0 }}>
            {(p.prev_score ?? 0).toFixed(2)} → <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{(p.current_score ?? p.match_score ?? 0).toFixed(2)}</span>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--mint)", margin: 0 }}>▲ +{delta.toFixed(3)}</p>
          <p style={{ fontSize: 9, color: "var(--mint)", opacity: 0.7, margin: 0 }}>+{pct}%</p>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 20, width: 36 }}>
          {[0.6, 0.7, 0.8, 0.9, 1.0].map((f, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 1, background: i === 4 ? "var(--mint)" : "var(--surface3)", height: `${Math.max(4, f * 20)}px` }} />
          ))}
        </div>
      </div>
    </Link>
  );
}

function NicheCard({ niche }: { niche: NicheRecommendation }) {
  const color = niche.tier === "high" ? "var(--mint)" : niche.tier === "medium" ? "var(--amber)" : "var(--text-dim)";
  const border = niche.tier === "high" ? "rgba(0,245,196,0.25)" : niche.tier === "medium" ? "rgba(255,184,77,0.25)" : "var(--border)";
  return (
    <div style={{ background: "var(--surface2)", border: `1px solid ${border}`, borderRadius: 4, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{niche.category}</h3>
          <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "3px 0 0" }}>{niche.product_count} products</p>
        </div>
        <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 2, background: `${color}10`, color, border: `1px solid ${border}`, letterSpacing: 0.5, textTransform: "capitalize" }}>
          {niche.tier} opportunity
        </span>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 9, color: "var(--text-secondary)" }}>
          <span>Opportunity gap</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{niche.opportunity_gap.toFixed(2)}</span>
        </div>
        <div style={{ height: 3, background: "var(--surface3)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${Math.min(niche.opportunity_gap * 200, 100)}%`, background: color, borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: niche.top_product ? 10 : 0 }}>
        {[{ label: "Demand", value: niche.avg_demand, color: "var(--blue)" }, { label: "Saturation", value: niche.avg_saturation, color: "var(--amber)" }, { label: "Avg Match", value: niche.avg_match, color: "var(--text-primary)" }].map(({ label, value, color: c }) => (
          <div key={label} style={{ background: "var(--surface3)", borderRadius: 4, padding: "8px", textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: c, margin: 0 }}>{value.toFixed(2)}</p>
            <p style={{ fontSize: 8, color: "var(--text-dim)", margin: "2px 0 0" }}>{label}</p>
          </div>
        ))}
      </div>
      {niche.top_product && <p style={{ fontSize: 9, color: "var(--text-secondary)", margin: 0 }}>Top: <span style={{ color: "var(--text-primary)" }}>{niche.top_product}</span></p>}
    </div>
  );
}

export default function RecommendationsPage() {
  const [data,       setData]       = useState<RecommendationsPayload | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<"opportunities" | "trending" | "niches">("opportunities");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try { setData(await getRecommendations()); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { key: "opportunities" as const, label: "Top Opportunities",      count: data?.opportunities.length },
    { key: "trending"      as const, label: "Trending Upward",        count: data?.trending.length      },
    { key: "niches"        as const, label: "Low-Competition Niches",  count: data?.niches.length        },
  ];

  const emptyMsg = {
    opportunities: { main: "No scored products yet.", sub: "Run the scoring pipeline from Admin → Scoring Models." },
    trending:      { main: "No trending products yet.", sub: "Run scoring at least twice to detect score changes." },
    niches:        { main: "No niche data yet.", sub: "Ingest products across multiple categories to see niche analysis." },
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">MERCHANT</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Recommendations</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
            {data?.generated_at ? `Updated ${new Date(data.generated_at).toLocaleTimeString()}` : "Personalized product intelligence"}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} style={{ fontSize: 11, padding: "7px 14px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: refreshing ? 0.6 : 1 }}>
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 0", borderRadius: 3, fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer",
            background: activeTab === t.key ? "var(--mint)" : "transparent",
            color: activeTab === t.key ? "var(--obsidian)" : "var(--text-secondary)",
          }}>
            {t.label}
            {t.count != null && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 9, background: activeTab === t.key ? "rgba(0,0,0,0.2)" : "var(--surface3)", color: activeTab === t.key ? "var(--obsidian)" : "var(--text-dim)" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 140, borderRadius: 4, background: "var(--surface2)", border: "1px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      ) : (
        <>
          {activeTab === "opportunities" && (
            <div>
              <p style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 14 }}>Highest-scoring products scored in the last 7 days — sorted by opportunity match.</p>
              {(data?.opportunities.length ?? 0) === 0 ? (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{emptyMsg.opportunities.main}</p>
                  <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "4px 0 0" }}>{emptyMsg.opportunities.sub}</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {data?.opportunities.map(p => <OpportunityCard key={p.id} p={p} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === "trending" && (
            <div>
              <p style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 14 }}>Products whose opportunity score has increased since the last scoring run.</p>
              {(data?.trending.length ?? 0) === 0 ? (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{emptyMsg.trending.main}</p>
                  <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "4px 0 0" }}>{emptyMsg.trending.sub}</p>
                </div>
              ) : (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  {data?.trending.map((p, i) => <TrendingRow key={p.id} p={p} rank={i + 1} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === "niches" && (
            <div>
              <p style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 14 }}>Categories with high demand but low market saturation — the best places to source new products.</p>
              {(data?.niches.length ?? 0) === 0 ? (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{emptyMsg.niches.main}</p>
                  <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "4px 0 0" }}>{emptyMsg.niches.sub}</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
