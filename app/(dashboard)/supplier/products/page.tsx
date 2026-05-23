"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMySupplierProfile, getSupplierProducts, type Product } from "@/lib/api";

type StatusFilter = "all" | "ingested" | "pending" | "invalid" | "stale";

function statusStyle(s: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    ingested:   { bg: "rgba(0,245,196,0.08)",  color: "var(--mint)",  border: "rgba(0,245,196,0.25)"  },
    pending:    { bg: "rgba(255,184,77,0.08)", color: "var(--amber)", border: "rgba(255,184,77,0.25)" },
    invalid:    { bg: "rgba(255,75,110,0.08)", color: "var(--red)",   border: "rgba(255,75,110,0.25)" },
    stale:      { bg: "var(--surface3)",       color: "var(--text-dim)", border: "var(--border)"      },
    validating: { bg: "rgba(77,159,255,0.08)", color: "var(--blue)",  border: "rgba(77,159,255,0.25)" },
  };
  const c = map[s] ?? map.stale;
  return { fontSize: 8, padding: "2px 7px", borderRadius: 2, background: c.bg, color: c.color, border: `1px solid ${c.border}`, letterSpacing: 0.5, textTransform: "capitalize" };
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<StatusFilter>("all");
  const [page, setPage]         = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    getMySupplierProfile().then(profile => {
      if (!profile) { setLoading(false); return; }
      getSupplierProducts(profile.id, { page, limit: LIMIT, sort: "created_at" } as never)
        .then(r => {
          const items = filter === "all" ? r.products : r.products.filter(p => p.ingestion_status === filter);
          setProducts(items);
          setTotal(r.pagination?.total ?? r.products.length);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [page, filter]);

  const filters: StatusFilter[] = ["all", "ingested", "pending", "invalid", "stale"];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">SUPPLIER</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Product Feeds</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{total} products in your catalog</p>
        </div>
        <Link href="/ingest" style={{ background: "var(--mint)", color: "var(--obsidian)", borderRadius: 4, padding: "8px 16px", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
          + Upload CSV
        </Link>
      </div>

      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4, width: "fit-content", marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
            padding: "4px 12px", borderRadius: 3, fontSize: 10, fontWeight: 500,
            textTransform: "capitalize", border: "none", cursor: "pointer",
            background: filter === f ? "var(--mint)" : "transparent",
            color: filter === f ? "var(--obsidian)" : "var(--text-secondary)",
          }}>{f}</button>
        ))}
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Product", "SKU", "Category", "Price", "Stock", "Score", "Status", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: "28px 14px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "28px 14px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>
                No products found. <Link href="/ingest" style={{ color: "var(--mint)" }}>Upload a CSV</Link> to get started.
              </td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{p.product_name}</p>
                  {p.brand && <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>{p.brand}</p>}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-dim)" }}>{p.sku || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.category || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.price != null ? `$${p.price.toFixed(2)}` : "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: (p.stock_quantity ?? 0) < 10 ? "var(--red)" : "var(--text-secondary)" }}>
                    {p.stock_quantity ?? 0}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.match_score?.toFixed(2) ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}><span style={statusStyle(p.ingestion_status)}>{p.ingestion_status}</span></td>
                <td style={{ padding: "10px 14px" }}>
                  <Link href={`/supplier/products/${p.id}`} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", textDecoration: "none" }}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
          <span style={{ fontSize: 10, color: "var(--text-dim)" }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={products.length < LIMIT} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: products.length < LIMIT ? 0.4 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}
