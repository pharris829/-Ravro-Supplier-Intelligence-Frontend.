"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { searchProducts, type Product } from "@/lib/api";

type SortKey = "match_score" | "demand_score" | "price";
type Tier = "all" | "high" | "medium" | "low";

function ScoreBar({ value }: { value?: number }) {
  if (value == null) return <span className="text-neutral-600 text-xs">—</span>;
  const pct = Math.round(value * 100);
  const color = value >= 0.75 ? "bg-emerald-500" : value >= 0.45 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-neutral-300 tabular-nums">{(value).toFixed(2)}</span>
    </div>
  );
}

function TierBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const tier = score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low";
  const styles = { high: "bg-emerald-950 text-emerald-400 border-emerald-900", medium: "bg-yellow-950 text-yellow-400 border-yellow-900", low: "bg-red-950 text-red-400 border-red-900" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${styles[tier]}`}>{tier}</span>;
}

export default function IntelligencePage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState("");
  const [tier, setTier]             = useState<Tier>("all");
  const [sortKey, setSortKey]       = useState<SortKey>("match_score");
  const [page, setPage]             = useState(1);
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
        items.sort((a, b) => {
          const av = (a[sortKey] ?? 0) as number;
          const bv = (b[sortKey] ?? 0) as number;
          return bv - av;
        });
        setProducts(items);
        setTotal(r.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, tier, sortKey, page]);

  useEffect(() => { load(); }, [load]);

  const avgScore = products.length
    ? (products.reduce((s, p) => s + (p.match_score ?? 0), 0) / products.length).toFixed(2)
    : "—";
  const highCount   = products.filter(p => (p.match_score ?? 0) >= 0.75).length;
  const medCount    = products.filter(p => { const s = p.match_score ?? 0; return s >= 0.45 && s < 0.75; }).length;
  const lowCount    = products.filter(p => (p.match_score ?? 0) < 0.45).length;

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Product Intelligence</h1>
        <p className="text-sm text-neutral-400 mt-1">Demand signals, opportunity scores, and supplier quality</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Avg Opportunity",  value: avgScore },
          { label: "High Opportunity", value: highCount,   color: "text-emerald-400" },
          { label: "Medium",           value: medCount,    color: "text-yellow-400"  },
          { label: "Low",              value: lowCount,    color: "text-red-400"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color || "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search products…"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
          {(["all","high","medium","low"] as Tier[]).map(t => (
            <button key={t} onClick={() => { setTier(t); setPage(1); }}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${tier === t ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="match_score">Sort: Opportunity</option>
          <option value="demand_score">Sort: Demand</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Product", "Category", "Price", "Demand", "Opportunity", "Tier", "Supplier"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/products/${p.id}`} className="text-white hover:text-indigo-400 font-medium">{p.product_name}</Link>
                  {p.sku && <p className="text-xs text-neutral-600">{p.sku}</p>}
                </td>
                <td className="px-4 py-3 text-neutral-400">{p.category || "—"}</td>
                <td className="px-4 py-3 text-neutral-300">{p.price != null ? `$${p.price.toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3"><ScoreBar value={p.demand_score} /></td>
                <td className="px-4 py-3"><ScoreBar value={p.match_score} /></td>
                <td className="px-4 py-3"><TierBadge score={p.match_score} /></td>
                <td className="px-4 py-3 text-neutral-400 text-xs">{p.supplier_name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3 mt-4">
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
          className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 text-neutral-300 disabled:opacity-40 hover:bg-neutral-700">Previous</button>
        <span className="text-xs text-neutral-500">Page {page} · {total} total</span>
        <button onClick={() => setPage(p => p+1)} disabled={products.length < LIMIT}
          className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 text-neutral-300 disabled:opacity-40 hover:bg-neutral-700">Next</button>
      </div>
    </div>
  );
}
