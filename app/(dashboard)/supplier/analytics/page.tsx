"use client";

import { useEffect, useState } from "react";
import { getMySupplierProfile, getSupplierProducts, type Product, type Supplier } from "@/lib/api";

interface MetricCard { label: string; value: string | number; sub?: string; color?: string; }

export default function SupplierAnalyticsPage() {
  const [profile,  setProfile]  = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getMySupplierProfile().then(p => {
      setProfile(p);
      if (p) getSupplierProducts(p.id, { limit: 50 } as never).then(r => setProducts(r.products)).catch(() => {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avgScore   = products.length ? products.reduce((s, p) => s + (p.match_score ?? 0), 0) / products.length : 0;
  const avgDemand  = products.length ? products.reduce((s, p) => s + (p.demand_score ?? 0), 0) / products.length : 0;
  const topProducts = [...products].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0)).slice(0, 5);
  const lowStock    = products.filter(p => (p.stock_quantity ?? 0) < 20);
  const byCategory  = products.reduce<Record<string, number>>((acc, p) => {
    const cat = p.category || "Uncategorized";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const metrics: MetricCard[] = [
    { label: "Avg Opportunity Score", value: avgScore.toFixed(2),   color: avgScore >= 0.6 ? "text-emerald-400" : "text-yellow-400" },
    { label: "Avg Demand Score",      value: avgDemand.toFixed(2),  color: avgDemand >= 0.6 ? "text-emerald-400" : "text-yellow-400" },
    { label: "Trust Score",           value: profile?.trust_score?.toFixed(1) ?? "—", color: "text-white" },
    { label: "Reliability Score",     value: profile?.reliability_score?.toFixed(1) ?? "—", color: "text-white" },
    { label: "Total Products",        value: products.length },
    { label: "Low Stock Alerts",      value: lowStock.length, color: lowStock.length > 0 ? "text-red-400" : "text-emerald-400" },
    { label: "Active Merchants",      value: 3,  sub: "mock" },
    { label: "Catalog Views (30d)",   value: 142, sub: "mock" },
  ];

  const tierCounts = {
    high:   products.filter(p => (p.match_score ?? 0) >= 0.75).length,
    medium: products.filter(p => { const s = p.match_score ?? 0; return s >= 0.45 && s < 0.75; }).length,
    low:    products.filter(p => (p.match_score ?? 0) < 0.45).length,
  };

  const mockMerchantActivity = [
    { merchant: "TechHub Direct",   views: 58, added: 3,  store: "Shopify"     },
    { merchant: "Urban Outpost LLC", views: 41, added: 1,  store: "WooCommerce" },
    { merchant: "Green Goods Co.",  views: 43, added: 0,  store: "Shopify"     },
  ];

  if (loading) return <div className="text-neutral-500 text-sm">Loading…</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-neutral-400 mt-1">Product performance and merchant activity for {profile?.name}</p>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {metrics.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color ?? "text-white"}`}>{value}</p>
            {sub && <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Opportunity tier breakdown */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Opportunity Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "High (≥0.75)",    value: tierCounts.high,   color: "bg-emerald-500", text: "text-emerald-400" },
              { label: "Medium (0.45–0.75)", value: tierCounts.medium, color: "bg-yellow-500", text: "text-yellow-400"  },
              { label: "Low (<0.45)",     value: tierCounts.low,    color: "bg-red-500",     text: "text-red-400"     },
            ].map(({ label, value, color, text }) => {
              const pct = products.length ? Math.round((value / products.length) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">{label}</span>
                    <span className={text}>{value} products ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Products by category */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Products by Category</h2>
          <div className="space-y-2">
            {Object.entries(byCategory).sort(([,a],[,b]) => b - a).map(([cat, count]) => {
              const pct = products.length ? Math.round((count / products.length) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">{cat}</span>
                    <span className="text-neutral-300">{count}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(byCategory).length === 0 && (
              <p className="text-neutral-500 text-xs">No products yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white">Top Performing Products</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Product", "Category", "Opportunity", "Demand", "Stock"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500 text-sm">No products</td></tr>
            ) : topProducts.map(p => (
              <tr key={p.id} className="border-b border-neutral-800/50">
                <td className="px-4 py-3 text-white text-sm font-medium">{p.product_name}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs">{p.category || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold tabular-nums ${(p.match_score ?? 0) >= 0.75 ? "text-emerald-400" : (p.match_score ?? 0) >= 0.45 ? "text-yellow-400" : "text-red-400"}`}>
                    {p.match_score?.toFixed(2) ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-400 text-xs tabular-nums">{p.demand_score?.toFixed(2) ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${(p.stock_quantity ?? 0) < 20 ? "text-red-400" : "text-neutral-300"}`}>
                    {p.stock_quantity ?? 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Merchant activity */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Merchant Activity</h2>
          <span className="text-xs text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded">Sample data</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Merchant", "Store", "Product Views", "Products Added"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMerchantActivity.map((m, i) => (
              <tr key={i} className="border-b border-neutral-800/50">
                <td className="px-4 py-3 text-white text-sm">{m.merchant}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs">{m.store}</td>
                <td className="px-4 py-3 text-neutral-300 text-sm tabular-nums">{m.views}</td>
                <td className="px-4 py-3 text-neutral-300 text-sm tabular-nums">{m.added}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
