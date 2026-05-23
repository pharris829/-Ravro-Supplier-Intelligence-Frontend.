"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTrendsOverview, getTrendsKeyword, getTrendsKeywordRelated,
  getCategoryTrends, getProductTrends, triggerTrendsBatchScore,
  type TrendsOverview, type TrendRecord, type RisingQuery,
  type CategoryTrend, type TrendedProduct,
} from "@/lib/api";

type Tab = "overview" | "keyword" | "categories" | "products";

const COUNTRIES: { code: string; name: string }[] = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" }, { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" }, { code: "AO", name: "Angola" }, { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" }, { code: "AM", name: "Armenia" }, { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" }, { code: "AZ", name: "Azerbaijan" }, { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" }, { code: "BD", name: "Bangladesh" }, { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" }, { code: "BE", name: "Belgium" }, { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" }, { code: "BT", name: "Bhutan" }, { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" }, { code: "BW", name: "Botswana" }, { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" }, { code: "BG", name: "Bulgaria" }, { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" }, { code: "CV", name: "Cabo Verde" }, { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" }, { code: "CA", name: "Canada" }, { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" }, { code: "CL", name: "Chile" }, { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" }, { code: "KM", name: "Comoros" }, { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" }, { code: "CR", name: "Costa Rica" }, { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" }, { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" }, { code: "DJ", name: "Djibouti" }, { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" }, { code: "EC", name: "Ecuador" }, { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" }, { code: "GQ", name: "Equatorial Guinea" }, { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" }, { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" }, { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" }, { code: "GM", name: "Gambia" }, { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" }, { code: "GH", name: "Ghana" }, { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" }, { code: "GT", name: "Guatemala" }, { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" }, { code: "GY", name: "Guyana" }, { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" }, { code: "HU", name: "Hungary" }, { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" }, { code: "ID", name: "Indonesia" }, { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" }, { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" }, { code: "JM", name: "Jamaica" }, { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" }, { code: "KZ", name: "Kazakhstan" }, { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" }, { code: "KW", name: "Kuwait" }, { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" }, { code: "LV", name: "Latvia" }, { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" }, { code: "LR", name: "Liberia" }, { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" }, { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" }, { code: "MW", name: "Malawi" }, { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" }, { code: "ML", name: "Mali" }, { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" }, { code: "MR", name: "Mauritania" }, { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" }, { code: "FM", name: "Micronesia" }, { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" }, { code: "MN", name: "Mongolia" }, { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" }, { code: "MZ", name: "Mozambique" }, { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" }, { code: "NR", name: "Nauru" }, { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" }, { code: "NZ", name: "New Zealand" }, { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" }, { code: "NG", name: "Nigeria" }, { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" }, { code: "PK", name: "Pakistan" }, { code: "PW", name: "Palau" },
  { code: "PA", name: "Panama" }, { code: "PG", name: "Papua New Guinea" }, { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" }, { code: "PH", name: "Philippines" }, { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" }, { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "RW", name: "Rwanda" }, { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" }, { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" }, { code: "SM", name: "San Marino" }, { code: "ST", name: "São Tomé and Príncipe" },
  { code: "SA", name: "Saudi Arabia" }, { code: "SN", name: "Senegal" }, { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" }, { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" }, { code: "SI", name: "Slovenia" }, { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" }, { code: "ZA", name: "South Africa" }, { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" }, { code: "LK", name: "Sri Lanka" }, { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" }, { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" }, { code: "TW", name: "Taiwan" }, { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" }, { code: "TH", name: "Thailand" }, { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" }, { code: "TO", name: "Tonga" }, { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" }, { code: "TR", name: "Turkey" }, { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" }, { code: "UG", name: "Uganda" }, { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" }, { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" }, { code: "UY", name: "Uruguay" }, { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" }, { code: "VE", name: "Venezuela" }, { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" }, { code: "ZM", name: "Zambia" }, { code: "ZW", name: "Zimbabwe" },
];

// ─── Sparkline bar chart ──────────────────────────────────────────────────────
function Sparkline({ timeline, color = "#00F5C4" }: { timeline: { value?: number[] }[]; color?: string }) {
  const vals = timeline.map(t => t.value?.[0] ?? 0);
  const max  = Math.max(...vals, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 40 }}>
      {vals.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: "1px 1px 0 0", minHeight: 2,
          height: `${Math.max(4, (v / max) * 40)}px`,
          background: i === vals.length - 1 ? color : `${color}55`,
        }} />
      ))}
    </div>
  );
}

// ─── Trend score pill ─────────────────────────────────────────────────────────
function TrendPill({ score }: { score?: number | null }) {
  if (score == null) return <span style={{ color: "var(--text-dim)", fontSize: 11 }}>—</span>;
  const pct   = Math.round(score * 100);
  const color = pct >= 70 ? "#00F5C4" : pct >= 40 ? "#FFB84D" : "#8890A4";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 40, height: 4, background: "var(--surface3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: "'Orbitron',monospace" }}>{pct}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const [tab,        setTab]      = useState<Tab>("overview");
  const [overview,   setOverview] = useState<TrendsOverview | null>(null);
  const [kwInput,    setKwInput]  = useState("ergonomic desk mat");
  const [kwSearch,   setKwSearch] = useState("");
  const [kwGeo,      setKwGeo]    = useState("US");
  const [kwRecord,   setKwRecord] = useState<TrendRecord | null>(null);
  const [kwRising,   setKwRising] = useState<RisingQuery[]>([]);
  const [categories, setCats]     = useState<CategoryTrend[]>([]);
  const [products,   setProducts] = useState<TrendedProduct[]>([]);
  const [loading,    setLoading]  = useState(true);
  const [kwLoading,  setKwLoading] = useState(false);
  const [scoring,    setScoring]  = useState(false);
  const [scoreMsg,   setScoreMsg] = useState<string | null>(null);

  const loadOverview = useCallback(() =>
    getTrendsOverview().then(setOverview).catch(() => {}), []);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      loadOverview(),
      getCategoryTrends().then(r => setCats(r.data)).catch(() => {}),
      getProductTrends(20).then(r => setProducts(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [loadOverview]);

  async function searchKeyword() {
    if (!kwInput.trim()) return;
    setKwSearch(kwInput.trim());
    setKwLoading(true);
    setKwRecord(null); setKwRising([]);
    try {
      const [trend, related] = await Promise.all([
        getTrendsKeyword(kwInput.trim(), { geo: kwGeo }),
        getTrendsKeywordRelated(kwInput.trim(), kwGeo),
      ]);
      setKwRecord(trend.data);
      setKwRising(related.rising ?? []);
    } catch { /* ignore */ }
    finally { setKwLoading(false); }
  }

  async function handleBatchScore() {
    setScoring(true); setScoreMsg(null);
    try {
      const r = await triggerTrendsBatchScore(50);
      setScoreMsg(r.message);
      await Promise.all([loadOverview(), getProductTrends(20).then(r => setProducts(r.data)).catch(() => {})]);
    } catch (err: unknown) {
      setScoreMsg(err instanceof Error ? err.message : "Failed");
    } finally { setScoring(false); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview",   label: "Overview"    },
    { key: "keyword",    label: "Keyword"      },
    { key: "categories", label: "Categories"  },
    { key: "products",   label: "Products"    },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="font-orbitron" style={{ fontSize: 22, fontWeight: 700, color: "var(--silver-bright)", letterSpacing: -0.5 }}>
            Trends
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Powered by Google Trends · 24h cache · US market
          </p>
        </div>
        <button onClick={handleBatchScore} disabled={scoring} style={{
          fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, letterSpacing: 2,
          textTransform: "uppercase", fontWeight: 600, cursor: scoring ? "default" : "pointer",
          color: scoring ? "var(--text-dim)" : "var(--obsidian)", background: scoring ? "var(--surface3)" : "var(--mint)",
          border: "none", padding: "8px 18px", borderRadius: 2, transition: "all 0.2s",
        }}>
          {scoring ? "Scoring…" : "▶ Score Products"}
        </button>
      </div>

      {scoreMsg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", fontSize: 12, borderRadius: 2, background: "rgba(0,245,196,0.06)", border: "1px solid var(--border-mint)", color: "var(--mint)" }}>
          ✓ {scoreMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 1, background: "var(--border)", border: "1px solid var(--border)",
        borderRadius: 3, overflow: "hidden", marginBottom: 20,
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "9px 0", fontSize: 10, letterSpacing: 2,
            textTransform: "uppercase", fontWeight: 600, border: "none", cursor: "pointer",
            fontFamily: "'Space Grotesk',sans-serif", transition: "all 0.2s",
            background: tab === t.key ? "var(--mint)" : "var(--surface)",
            color:      tab === t.key ? "var(--obsidian)" : "var(--text-secondary)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-dim)", fontSize: 13, padding: 32, textAlign: "center" }}>Loading…</div>
      ) : (
        <>
          {/* ─── OVERVIEW ─── */}
          {tab === "overview" && (
            <div>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 20, background: "var(--border)", border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden" }}>
                {[
                  { label: "Products Scored",  value: overview?.stats?.scored ?? "—" },
                  { label: "Total Products",    value: overview?.stats?.total  ?? "—" },
                  { label: "Avg Trend Score",   value: overview?.stats?.avg_trend != null ? `${Math.round(+overview.stats.avg_trend * 100)}` : "—" },
                  { label: "Peak Trend",        value: overview?.stats?.max_trend != null ? `${Math.round(+overview.stats.max_trend * 100)}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "var(--surface)", padding: "18px 16px", textAlign: "center" }}>
                    <span className="font-orbitron" style={{ fontSize: 22, fontWeight: 700, color: "var(--mint)", display: "block", marginBottom: 3 }}>{value}</span>
                    <span style={{ fontSize: 8, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Top keywords */}
              {(overview?.top_keywords?.length ?? 0) > 0 && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: 3, color: "var(--mint)", textTransform: "uppercase" }}>Cached Keywords</span>
                  </div>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Keyword","Category","Trend Score","Cached"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 9, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {overview?.top_keywords.map((k, i) => (
                        <tr key={`${k.keyword}-${i}`} style={{ borderBottom: "1px solid rgba(184,188,200,0.06)", cursor: "pointer" }}
                          onClick={() => { setKwInput(k.keyword); setTab("keyword"); setTimeout(searchKeyword, 100); }}>
                          <td style={{ padding: "10px 16px", color: "var(--text-primary)", fontWeight: 500 }}>{k.keyword}</td>
                          <td style={{ padding: "10px 16px", color: "var(--text-secondary)", fontSize: 11 }}>{k.category ?? "—"}</td>
                          <td style={{ padding: "10px 16px" }}><TrendPill score={k.trend_score} /></td>
                          <td style={{ padding: "10px 16px", color: "var(--text-dim)", fontSize: 10 }}>{new Date(k.fetched_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(overview?.top_keywords?.length ?? 0) === 0 && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, padding: "32px 24px", textAlign: "center" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>No trend data yet.</p>
                  <p style={{ color: "var(--text-dim)", fontSize: 11 }}>Click "Score Products" to fetch Google Trends data for your catalog.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── KEYWORD ─── */}
          {tab === "keyword" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <input value={kwInput} onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchKeyword()}
                  placeholder="Enter keyword or product name…" style={{
                    flex: 1, background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 2, padding: "10px 14px", fontSize: 13,
                    color: "var(--text-primary)", outline: "none", fontFamily: "'Space Grotesk',sans-serif",
                  }}
                  onFocus={e => { e.target.style.borderColor = "var(--border-mint)"; }}
                  onBlur={e =>  { e.target.style.borderColor = "var(--border)"; }} />
                <select
                  value={kwGeo}
                  onChange={e => setKwGeo(e.target.value)}
                  style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 2, padding: "10px 10px", fontSize: 11,
                    color: "var(--text-primary)", fontFamily: "'Space Grotesk',sans-serif",
                    cursor: "pointer", outline: "none", minWidth: 160,
                  }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <button onClick={searchKeyword} disabled={kwLoading} style={{
                  fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, letterSpacing: 2,
                  textTransform: "uppercase", fontWeight: 600, padding: "10px 20px",
                  background: "var(--mint)", color: "var(--obsidian)", border: "none",
                  borderRadius: 2, cursor: kwLoading ? "default" : "pointer", opacity: kwLoading ? 0.6 : 1,
                }}>
                  {kwLoading ? "…" : "Search"}
                </button>
              </div>

              {kwLoading && <div style={{ color: "var(--text-dim)", textAlign: "center", padding: 32 }}>Fetching from Google Trends…</div>}

              {kwRecord && !kwLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Trend card */}
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border-mint)", borderRadius: 3, padding: "20px 20px 16px", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,var(--mint),transparent)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <span className="font-orbitron" style={{ fontSize: 13, fontWeight: 700, color: "var(--silver-bright)", letterSpacing: 1 }}>{kwSearch}</span>
                        <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, letterSpacing: 1 }}>
                          90-DAY INTEREST · {COUNTRIES.find(c => c.code === kwGeo)?.name.toUpperCase() ?? kwGeo}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="font-orbitron" style={{ fontSize: 22, fontWeight: 700, color: "var(--mint)" }}>
                          {kwRecord.trend_score != null ? Math.round(+kwRecord.trend_score * 100) : "—"}
                        </span>
                        <p style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: 1 }}>TREND SCORE</p>
                      </div>
                    </div>
                    {(kwRecord.data?.timeline?.length ?? 0) > 0
                      ? <Sparkline timeline={kwRecord.data.timeline!} />
                      : <p style={{ fontSize: 11, color: "var(--text-dim)" }}>No timeline data available</p>
                    }
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "var(--text-dim)" }}>
                      <span>90 days ago</span><span>Today</span>
                    </div>
                  </div>

                  {/* Rising queries */}
                  {kwRising.length > 0 && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                        <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: 3, color: "var(--amber)", textTransform: "uppercase" }}>↑ Rising Queries</span>
                      </div>
                      <div style={{ padding: "8px 16px" }}>
                        {kwRising.slice(0, 10).map((r, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(184,188,200,0.06)" }}>
                            <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{r.query}</span>
                            <span style={{ fontSize: 10, color: "var(--amber)", fontWeight: 600 }}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!kwRecord && !kwLoading && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, padding: "32px 24px", textAlign: "center" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Search any keyword to see Google Trends data.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── CATEGORIES ─── */}
          {tab === "categories" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {categories.length === 0 && (
                <div style={{ gridColumn: "1/-1", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, padding: "32px 24px", textAlign: "center" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Click "Score Products" first to fetch category trend data.</p>
                </div>
              )}
              {categories.map(cat => (
                <div key={cat.category} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span className="font-orbitron" style={{ fontSize: 11, fontWeight: 600, color: "var(--silver-bright)", letterSpacing: 0.5 }}>{cat.category}</span>
                    <TrendPill score={cat.trend_score} />
                  </div>
                  {(cat.data?.timeline?.length ?? 0) > 0
                    ? <Sparkline timeline={cat.data!.timeline!} color="#4D9FFF" />
                    : <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>No data cached</span>
                      </div>
                  }
                </div>
              ))}
            </div>
          )}

          {/* ─── PRODUCTS ─── */}
          {tab === "products" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Product","Category","Trend Score","Opportunity","Supplier"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 9, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 12 }}>
                      No trend scores yet — click "Score Products" to fetch data.
                    </td></tr>
                  ) : products.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(184,188,200,0.06)" }}>
                      <td style={{ padding: "10px 16px", color: "var(--text-primary)", fontWeight: 500 }}>{p.product_name}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)", fontSize: 11 }}>{p.category ?? "—"}</td>
                      <td style={{ padding: "10px 16px" }}><TrendPill score={p.trend_score} /></td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: 11, color: (p.match_score ?? 0) >= 0.7 ? "var(--mint)" : "var(--text-secondary)", fontWeight: 600, fontFamily: "'Orbitron',monospace" }}>
                          {p.match_score?.toFixed(2) ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text-dim)", fontSize: 11 }}>{p.supplier_name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
