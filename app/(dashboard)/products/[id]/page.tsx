"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProduct, getProductOpportunity, type Product, type ProductOpportunity } from "@/lib/api";
import { ScoreLegend } from "@/components/ScoreLegend";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product,     setProduct]     = useState<Product | null>(null);
  const [opportunity, setOpportunity] = useState<ProductOpportunity | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getProduct(id).then(r => {
      setProduct(r.product);
      return getProductOpportunity(id).then(setOpportunity).catch(() => {});
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ fontSize: 11, color: "var(--text-dim)", padding: 16 }}>Loading…</div>;
  if (!product) return <div style={{ fontSize: 11, color: "var(--red)", padding: 16 }}>Product not found.</div>;

  const tierColor = { high: "var(--mint)", medium: "var(--amber)", low: "var(--red)" };

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/products" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
        ← Back to products
      </Link>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 22px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{product.product_name}</h1>
            <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{product.brand} · {product.category} · SKU {product.sku}</p>
          </div>
          {opportunity && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize", color: tierColor[opportunity.opportunity_tier] }}>
              {opportunity.opportunity_tier} opportunity
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            { label: "Price",       value: product.price ? `$${product.price.toFixed(2)}` : "—" },
            { label: "Stock",       value: product.stock_quantity },
            { label: "Match Score", value: product.match_score?.toFixed(2) ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{String(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {opportunity && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "18px 22px", marginBottom: 14 }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">OPPORTUNITY ANALYSIS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Opportunity Score",       value: opportunity.opportunity_score?.toFixed(2) },
              { label: "Demand Score",            value: opportunity.demand_score?.toFixed(2) },
              { label: "Supplier Trust",          value: opportunity.supplier?.trust_score?.toFixed(2) },
              { label: "Competitors in Category", value: opportunity.market_context?.competitors_in_category },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.supplier_name && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 18px", marginBottom: 14 }}>
          <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4 }}>Supplier</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{product.supplier_name}</p>
          {product.supplier_trust_score && <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 3 }}>Trust score: {product.supplier_trust_score}</p>}
        </div>
      )}

      <ScoreLegend activeScore={product.match_score ?? opportunity?.opportunity_score} defaultOpen={false} />
    </div>
  );
}
