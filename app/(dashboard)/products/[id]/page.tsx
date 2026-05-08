"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProduct, getProductOpportunity, type Product, type ProductOpportunity } from "@/lib/api";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [opportunity, setOpportunity] = useState<ProductOpportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(id)
      .then((r) => {
        setProduct(r.product);
        return getProductOpportunity(id).then(setOpportunity).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-neutral-500 text-sm">Loading…</div>;
  if (!product) return <div className="text-red-400 text-sm">Product not found.</div>;

  const tierColor = { high: "text-emerald-400", medium: "text-yellow-400", low: "text-red-400" };

  return (
    <div className="max-w-3xl">
      <Link href="/products" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">
        ← Back to products
      </Link>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xl font-semibold text-white">{product.product_name}</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{product.brand} · {product.category} · SKU {product.sku}</p>
          </div>
          {opportunity && (
            <span className={`text-sm font-semibold uppercase tracking-wide ${tierColor[opportunity.opportunity_tier]}`}>
              {opportunity.opportunity_tier} opportunity
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { label: "Price",          value: product.price ? `$${product.price.toFixed(2)}` : "—" },
            { label: "Stock",          value: product.stock_quantity },
            { label: "Match Score",    value: product.match_score?.toFixed(2) ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-neutral-800 rounded-lg p-3">
              <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
              <p className="text-white font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {opportunity && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-5">
          <h2 className="text-sm font-medium text-neutral-300 mb-4">Opportunity Analysis</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Opportunity Score",    value: opportunity.opportunity_score?.toFixed(2) },
              { label: "Demand Score",         value: opportunity.demand_score?.toFixed(2) },
              { label: "Supplier Trust",       value: opportunity.supplier?.trust_score?.toFixed(2) },
              { label: "Competitors in Category", value: opportunity.market_context?.competitors_in_category },
            ].map(({ label, value }) => (
              <div key={label} className="bg-neutral-800 rounded-lg p-3">
                <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
                <p className="text-white font-semibold">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.supplier_name && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-xs text-neutral-500 mb-0.5">Supplier</p>
          <p className="text-sm text-white">{product.supplier_name}</p>
          {product.supplier_trust_score && (
            <p className="text-xs text-neutral-400 mt-0.5">Trust score: {product.supplier_trust_score}</p>
          )}
        </div>
      )}
    </div>
  );
}
