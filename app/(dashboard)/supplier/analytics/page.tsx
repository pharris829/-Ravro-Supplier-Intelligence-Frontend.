"use client";

import { useEffect, useState } from "react";
import { getMySupplierProfile, getSupplierProducts, type Product, type Supplier } from "@/lib/api";

const mockActivity = [
  { merchant: "TechHub Direct",    views: 58, added: 3, store: "Shopify"      },
  { merchant: "Urban Outpost LLC", views: 41, added: 1, store: "WooCommerce"  },
  { merchant: "Green Goods Co.",   views: 43, added: 0, store: "Shopify"      },
];

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

  const avgScore  = products.length ? products.reduce((s, p) => s + (p.match_score ?? 0), 0) / products.length : 0;
  const avgDemand = products.length ? products.reduce((s, p) => s + (p.demand_score ?? 0), 0) / products.length : 0;
  const topProducts = [...products].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0)).slice(0, 5);
  const lowStock    = products.filter(p => (p.stock_quantity ?? 0) < 20);
  const byCategory  = products.reduce<Record<string, number>>((acc, p) => {
    const cat = p.category || "Uncategorized";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const tierCounts = {
    high:   products.filter(p => (p.match_score ?? 0) >= 0.75).length,
    medium: products.filter(p => { const s = p.match_score ?? 0; return s >= 0.45 && s < 0.75; }).length,
    low:    products.filter(p => (p.match_score ?? 0) < 0.45).length,
  };

  const statCards = [
    { label: "Avg Opportunity Score", value: avgScore.toFixed(2),  color: avgScore >= 0.6 ? "var(--mint)" : "var(--amber)" },
    { label: "Avg Demand Score",      value: avgDemand.toFixed(2), color: avgDemand >= 0.6 ? "var(--mint)" : "var(--amber)" },
    { label: "Trust Score",           value: profile?.trust_score?.toFixed(1) ?? "—",         color: "var(--text-primary)" },
    { label: "Reliability Score",     value: profile?.reliability_score?.toFixed(1) ?? "—",   color: "var(--text-primary)" },
    { label: "Total Products",        value: products.length,  color: "var(--text-primary)" },
    { label: "Low Stock Alerts",      value: lowStock.length,  color: lowStock.length > 0 ? "var(--red)" : "var(--mint)" },
    { label: "Active Merchants",      value: 3,   color: "var(--text-primary)" },
    { label: "Catalog Views (30d)",   value: 142, color: "var(--text-primary)" },
  ];

  if (loading) return <div style={{ fontSize: 11, color: "var(--text-dim)", padding: 16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">SUPPLIER</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Product performance and merchant activity for {profile?.name}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {statCards.map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {/* Tier breakdown */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">OPPORTUNITY BREAKDOWN</div>
          {[
            { label: "High (≥0.75)",      value: tierCounts.high,   color: "var(--mint)"  },
            { label: "Medium (0.45–0.75)", value: tierCounts.medium, color: "var(--amber)" },
            { label: "Low (<0.45)",        value: tierCounts.low,    color: "var(--red)"   },
          ].map(({ label, value, color }) => {
            const pct = products.length ? Math.round((value / products.length) * 100) : 0;
            return (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{label}</span>
                  <span style={{ fontSize: 10, color }}>{value} ({pct}%)</span>
                </div>
                <div style={{ height: 3, background: "var(--surface3)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* By category */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">BY CATEGORY</div>
          {Object.entries(byCategory).sort(([,a],[,b]) => b - a).map(([cat, count]) => {
            const pct = products.length ? Math.round((count / products.length) * 100) : 0;
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{cat}</span>
                  <span style={{ fontSize: 10, color: "var(--text-primary)" }}>{count}</span>
                </div>
                <div style={{ height: 3, background: "var(--surface3)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--mint)", borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
          {Object.keys(byCategory).length === 0 && <p style={{ fontSize: 10, color: "var(--text-dim)" }}>No products yet</p>}
        </div>
      </div>

      {/* Top products */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: 7, letterSpacing: 2, color: "var(--text-dim)" }} className="font-orbitron">TOP PERFORMING PRODUCTS</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Product","Category","Opportunity","Demand","Stock"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>No products</td></tr>
            ) : topProducts.map(p => {
              const scoreColor = (p.match_score ?? 0) >= 0.75 ? "var(--mint)" : (p.match_score ?? 0) >= 0.45 ? "var(--amber)" : "var(--red)";
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{p.product_name}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-secondary)" }}>{p.category || "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: scoreColor }}>{p.match_score?.toFixed(2) ?? "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-secondary)" }}>{p.demand_score?.toFixed(2) ?? "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: 11, color: (p.stock_quantity ?? 0) < 20 ? "var(--red)" : "var(--text-secondary)" }}>{p.stock_quantity ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Merchant activity */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)" }} className="font-orbitron">MERCHANT ACTIVITY</div>
          <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 2, background: "var(--surface3)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>Sample data</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Merchant","Store","Product Views","Products Added"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockActivity.map((m, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{m.merchant}</td>
                <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-secondary)" }}>{m.store}</td>
                <td style={{ padding: "10px 16px", fontSize: 11, color: "var(--text-primary)" }}>{m.views}</td>
                <td style={{ padding: "10px 16px", fontSize: 11, color: "var(--text-primary)" }}>{m.added}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
