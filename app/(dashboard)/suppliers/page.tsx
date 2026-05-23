"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSuppliers, type Supplier } from "@/lib/api";

export default function SuppliersPage() {
  const [suppliers,   setSuppliers]   = useState<Supplier[]>([]);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [page,        setPage]        = useState(1);

  useEffect(() => {
    setLoading(true);
    getSuppliers({ page, limit: 20 })
      .then(r => { setSuppliers(r.suppliers); setPagination(r.pagination); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">CATALOG</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Suppliers</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{pagination.total} total</p>
        </div>
      </div>

      {error && <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {suppliers.map(s => (
            <Link key={s.id} href={`/suppliers/${s.id}`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4,
              padding: "14px 18px", textDecoration: "none", transition: "border-color 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{s.name}</p>
                <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "3px 0 0" }}>
                  {s.categories?.join(", ") || "—"} · {s.country || "—"}
                </p>
              </div>
              <div style={{ textAlign: "right", fontSize: 10, color: "var(--text-secondary)", flexShrink: 0, marginLeft: 16 }}>
                <p style={{ margin: 0 }}>Trust <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.trust_score ?? "—"}</span></p>
                <p style={{ margin: "3px 0 0" }}>Products <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.product_count ?? "—"}</span></p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
          <span style={{ padding: "5px 10px", fontSize: 10, color: "var(--text-dim)" }}>{page} / {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: page === pagination.pages ? 0.4 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}
