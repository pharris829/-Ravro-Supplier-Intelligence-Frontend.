"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupplier, getSupplierProducts, type Supplier, type Product } from "@/lib/api";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getSupplier(id), getSupplierProducts(id)])
      .then(([s, p]) => { setSupplier(s.supplier); setProducts(p.products); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ fontSize: 11, color: "var(--text-dim)", padding: 16 }}>Loading…</div>;
  if (!supplier) return <div style={{ fontSize: 11, color: "var(--red)", padding: 16 }}>Supplier not found.</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/suppliers" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
        ← Back to suppliers
      </Link>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "20px 22px", marginBottom: 16, boxShadow: "0 0 16px rgba(0,245,196,0.05)" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, marginBottom: 4 }}>{supplier.name}</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 14 }}>{supplier.categories?.join(", ")} · {supplier.country}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            { label: "Trust Score",       value: supplier.trust_score },
            { label: "Reliability Score", value: supplier.reliability_score },
            { label: "Products",          value: supplier.product_count },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">
        PRODUCTS ({products.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {products.map(p => (
          <Link key={p.id} href={`/products/${p.id}`} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4,
            padding: "12px 16px", textDecoration: "none", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{p.product_name}</p>
              <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "2px 0 0" }}>{p.category} · {p.sku}</p>
            </div>
            <div style={{ textAlign: "right", fontSize: 10, color: "var(--text-secondary)", flexShrink: 0, marginLeft: 16 }}>
              <p style={{ margin: 0 }}>Score <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{p.match_score?.toFixed(2) ?? "—"}</span></p>
              <p style={{ margin: "2px 0 0" }}>${p.price?.toFixed(2) ?? "—"}</p>
            </div>
          </Link>
        ))}
        {products.length === 0 && <p style={{ fontSize: 11, color: "var(--text-dim)" }}>No products ingested yet.</p>}
      </div>
    </div>
  );
}
