"use client";

import { useState } from "react";
import Link from "next/link";
import { searchProducts, type Product } from "@/lib/api";
import { getFlag } from "@/lib/flags";
import { ScoreLegend, ScoreTierBadge } from "@/components/ScoreLegend";

function tierColor(score?: number): string {
  if (!score) return "var(--text-dim)";
  if (score >= 0.91) return "#00F5C4";
  if (score >= 0.76) return "#4D9FFF";
  if (score >= 0.61) return "#A78BFA";
  if (score >= 0.41) return "#FFB84D";
  if (score >= 0.21) return "#8890A4";
  return "#FF4B6E";
}

export default function ProductsPage() {
  const [query,        setQuery]        = useState("");
  const [products,     setProducts]     = useState<Product[]>([]);
  const [total,        setTotal]        = useState<number | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true); setError(""); setHoveredScore(null);
    try {
      const r = await searchProducts({ q: query });
      setProducts(r.products);
      setTotal(r.pagination.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally { setLoading(false); }
  }

  const hasResults = products.length > 0;

  return (
    <div style={{ maxWidth: hasResults ? 1100 : 900 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">CATALOG</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Products</h1>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search products, categories, brands…"
          style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 12px", fontSize: 11, color: "var(--text-primary)", outline: "none" }} />
        <button type="submit" disabled={loading} style={{
          background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4,
          padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1,
        }}>{loading ? "Searching…" : "Search"}</button>
      </form>

      {error && <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 12 }}>{error}</p>}

      {/* No results yet — show collapsed legend as a reference */}
      {!hasResults && (
        <div style={{ marginTop: 8 }}>
          <ScoreLegend />
        </div>
      )}

      {/* Results + live legend side by side */}
      {hasResults && (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* ── Product list ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 10 }}>
              {total} result{total !== 1 ? "s" : ""} — hover a product to see its score position
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {products.map(p => {
                const isHovered = hoveredScore === p.match_score && p.match_score != null;
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "var(--surface2)",
                      border: `1px solid ${isHovered ? "var(--border-mint)" : "var(--border)"}`,
                      borderRadius: 4, padding: "12px 16px", textDecoration: "none",
                      transition: "border-color 0.15s, background 0.15s",
                      background: isHovered ? "rgba(0,245,196,0.03)" : "var(--surface2)",
                    } as React.CSSProperties}
                    onMouseEnter={() => setHoveredScore(p.match_score ?? null)}
                    onMouseLeave={() => setHoveredScore(null)}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.product_name}
                      </p>
                      <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "2px 0 0" }}>
                        {p.brand} · {p.category} · {p.sku}
                      </p>
                      {p.supplier_name && (
                        <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "1px 0 0" }}>by {p.supplier_name}</p>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginBottom: 4 }}>
                        {getFlag("opportunity_tier_badges") && <ScoreTierBadge score={p.match_score} />}
                        <span style={{ fontSize: 13, fontWeight: 700, color: tierColor(p.match_score), fontFamily: "'Orbitron',monospace" }}>
                          {p.match_score?.toFixed(2) ?? "—"}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0 }}>
                        ${p.price?.toFixed(2) ?? "—"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Sticky score legend ── */}
          <div style={{ width: 300, flexShrink: 0, position: "sticky", top: 20 }}>
            <ScoreLegend
              activeScore={hoveredScore}
              collapsible={false}
              defaultOpen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
