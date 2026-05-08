"use client";

import { useState } from "react";
import Link from "next/link";
import { searchProducts, type Product } from "@/lib/api";

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const r = await searchProducts({ q: query });
      setProducts(r.products);
      setTotal(r.pagination.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const tierColor = (score?: number) => {
    if (!score) return "text-neutral-500";
    if (score >= 0.75) return "text-emerald-400";
    if (score >= 0.45) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-white mb-6">Products</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, categories, brands…"
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {total !== null && (
        <p className="text-xs text-neutral-500 mb-3">{total} results</p>
      )}

      <div className="space-y-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-indigo-600 rounded-xl px-5 py-4 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-white group-hover:text-indigo-400">{p.product_name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{p.brand} · {p.category} · {p.sku}</p>
              {p.supplier_name && (
                <p className="text-xs text-neutral-600 mt-0.5">by {p.supplier_name}</p>
              )}
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className={`font-semibold ${tierColor(p.match_score)}`}>
                Score {p.match_score?.toFixed(2) ?? "—"}
              </p>
              <p className="text-neutral-400">${p.price?.toFixed(2) ?? "—"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
