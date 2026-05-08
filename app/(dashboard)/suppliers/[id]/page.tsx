"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupplier, getSupplierProducts, type Supplier, type Product } from "@/lib/api";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSupplier(id), getSupplierProducts(id)])
      .then(([s, p]) => { setSupplier(s.supplier); setProducts(p.products); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-neutral-500 text-sm">Loading…</div>;
  if (!supplier) return <div className="text-red-400 text-sm">Supplier not found.</div>;

  return (
    <div className="max-w-4xl">
      <Link href="/suppliers" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">
        ← Back to suppliers
      </Link>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">{supplier.name}</h1>
        <p className="text-sm text-neutral-400 mb-4">{supplier.categories?.join(", ")} · {supplier.country}</p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { label: "Trust Score",       value: supplier.trust_score },
            { label: "Reliability Score", value: supplier.reliability_score },
            { label: "Products",          value: supplier.product_count },
          ].map(({ label, value }) => (
            <div key={label} className="bg-neutral-800 rounded-lg p-3">
              <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
              <p className="text-white font-semibold">{value ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-sm font-medium text-neutral-300 mb-3">Products ({products.length})</h2>
      <div className="space-y-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-indigo-600 rounded-xl px-4 py-3 transition-colors group"
          >
            <div>
              <p className="text-sm text-white group-hover:text-indigo-400">{p.product_name}</p>
              <p className="text-xs text-neutral-500">{p.category} · {p.sku}</p>
            </div>
            <div className="text-right text-xs text-neutral-400">
              <p>Score <span className="text-white font-medium">{p.match_score?.toFixed(2) ?? "—"}</span></p>
              <p>${p.price?.toFixed(2) ?? "—"}</p>
            </div>
          </Link>
        ))}
        {products.length === 0 && <p className="text-sm text-neutral-500">No products ingested yet.</p>}
      </div>
    </div>
  );
}
