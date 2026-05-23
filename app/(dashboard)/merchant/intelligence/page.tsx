"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { searchProducts, type Product } from "@/lib/api";

type SortKey = "match_score" | "demand_score" | "price";
type Tier = "all" | "high" | "medium" | "low";

function ScoreBar({ value }: { value?: number }) {
  if (value == null) return <span style={{ color: "var(--text-dim)", fontSize: 10 }}>—</span>;
  const pct = Math.round(value * 100);
  const color = value >= 0.75 ? "var(--mint)" : value >= 0.45 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 56, height: 3, background: "var(--surface3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{value.toFixed(2)}</span>
    </div>
  );
}

function TierBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const tier = score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low";
  const color = tier === "high" ? "var(--mint)" : tier === "medium" ? "var(--amber)" : "var(--red)";
  const bg = tier === "high" ? "rgba(0,245,196,0.08)" : tier === "medium" ? "rgba(255,184,77,0.08)" : "rgba(255,75,110,0.08)";
  const border = tier === "high" ? "rgba(0,245,196,0.25)" : tier === "medium" ? "rgba(255,184,77,0.25)" : "rgba(255,75,110,0.25)";
  return (
    <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 2, background: bg, color, border: `1px solid ${border}`, letterSpacing: 0.5, textTransform: "capitalize" }}>
      {tier}
    </span>
  );
}

export default function IntelligencePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [tier, setTier]         = useState<Tier>("all");
  const [sortKey, setSortKey]   = useState<SortKey>("match_score");
  const [page, setPage]         = useState(1);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    searchProducts({ q: query || "a", page, limit: LIMIT } as never)
      .then(r => {
        let items = r.products;
        if (tier !== "all") {
          items = items.filter(p => {
            const s = p.match_score ?? 0;
            return tier === "high" ? s >= 0.75 : tier === "medium" ? s >= 0.45 && s < 0.75 : s < 0.45;
          });
        }
        items.sort((a, b) => ((b[sortKey] ?? 0) as number) - ((a[sortKey] ?? 0) as number));
        setProducts(items);
        setTotal(r.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, tier, sortKey, page]);

  useEffect(() => { load(); }, [load]);

  const avgScore  = products.length ? (products.reduce((s, p) => s + (p.match_score ?? 0), 0) / products.length).toFixed(2) : "—";
  const highCount = products.filter(p => (p.match_score ?? 0) >= 0.75).length;
  const medCount  = products.filter(p => { const s = p.match_score ?? 0; return s >= 0.45 && s < 0.75; }).length;
  const lowCount  = products.filter(p => (p.match_score ?? 0) < 0.45).length;

  const summaryCards = [
    { label: "Avg Opportunity",  value: avgScore,   color: "var(--text-primary)" },
    { label: "High Opportunity", value: highCount,  color: "var(--mint)"         },
    { label: "Medium",           value: medCount,   color: "var(--amber)"        },
    { label: "Low",              value: lowCount,   color: "var(--red)"          },
  ];

  const tierOpts: Tier[] = ["all", "high", "medium", "low"];

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">INTELLIGENCE</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Product Intelligence</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Demand signals, opportunity scores, and supplier quality</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5, letterSpacing: 0.3 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search products…"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 180, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "var(--text-primary)", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 3, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4 }}>
          {tierOpts.map(t => (
            <button key={t} onClick={() => { setTier(t); setPage(1); }} style={{
              padding: "4px 10px", borderRadius: 3, fontSize: 10, fontWeight: 500,
              textTransform: "capitalize", border: "none", cursor: "pointer",
              background: tier === t ? "var(--mint)" : "transparent",
              color: tier === t ? "var(--obsidian)" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} style={{
          background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4,
          padding: "7px 10px", fontSize: 11, color: "var(--text-primary)", outline: "none",
        }}>
          <option value="match_score">Sort: Opportunity</option>
          <option value="demand_score">Sort: Demand</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Product", "Category", "Price", "Demand", "Opportunity", "Tier", "Supplier"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "28px 14px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "28px 14px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 14px" }}>
                  <Link href={`/products/${p.id}`} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>{p.product_name}</Link>
                  {p.sku && <p style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>{p.sku}</p>}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.category || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.price != null ? `$${p.price.toFixed(2)}` : "—"}</td>
                <td style={{ padding: "10px 14px" }}><ScoreBar value={p.demand_score} /></td>
                <td style={{ padding: "10px 14px" }}><ScoreBar value={p.match_score} /></td>
                <td style={{ padding: "10px 14px" }}><TierBadge score={p.match_score} /></td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.supplier_name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
          padding: "5px 12px", fontSize: 10, borderRadius: 4, background: "var(--surface3)",
          color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: page === 1 ? 0.4 : 1,
        }}>Previous</button>
        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>Page {page} · {total} total</span>
        <button onClick={() => setPage(p => p + 1)} disabled={products.length < LIMIT} style={{
          padding: "5px 12px", fontSize: 10, borderRadius: 4, background: "var(--surface3)",
          color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: products.length < LIMIT ? 0.4 : 1,
        }}>Next</button>
      </div>
    </div>
  );
}
