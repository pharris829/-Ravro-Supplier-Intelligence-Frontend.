"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMySupplierProfile, getSupplierProducts, type Product } from "@/lib/api";

type StatusFilter = "all" | "ingested" | "pending" | "invalid" | "stale";

const STATUS_STYLES: Record<string, string> = {
  ingested:   "bg-emerald-950 text-emerald-400 border-emerald-900",
  pending:    "bg-yellow-950 text-yellow-400 border-yellow-900",
  invalid:    "bg-red-950 text-red-400 border-red-900",
  stale:      "bg-neutral-800 text-neutral-500 border-neutral-700",
  validating: "bg-blue-950 text-blue-400 border-blue-900",
};

export default function SupplierProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<StatusFilter>("all");
  const [page, setPage]           = useState(1);
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
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Product Feeds</h1>
          <p className="text-sm text-neutral-400 mt-1">{total} products in your catalog</p>
        </div>
        <Link href="/ingest"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Upload CSV
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Product", "SKU", "Category", "Price", "Stock", "Score", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500 text-sm">Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500 text-sm">
                No products found. <Link href="/ingest" className="text-indigo-400 hover:underline">Upload a CSV</Link> to get started.
              </td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white font-medium text-sm">{p.product_name}</p>
                  {p.brand && <p className="text-xs text-neutral-600">{p.brand}</p>}
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{p.sku || "—"}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs">{p.category || "—"}</td>
                <td className="px-4 py-3 text-neutral-300 text-sm">
                  {p.price != null ? `$${p.price.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${(p.stock_quantity ?? 0) < 10 ? "text-red-400" : "text-neutral-300"}`}>
                    {p.stock_quantity ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-400 text-xs tabular-nums">
                  {p.match_score?.toFixed(2) ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[p.ingestion_status] ?? STATUS_STYLES.pending}`}>
                    {p.ingestion_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/supplier/products/${p.id}`}
                    className="text-xs px-3 py-1 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 text-neutral-300 disabled:opacity-40 hover:bg-neutral-700">Previous</button>
          <span className="text-xs text-neutral-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={products.length < LIMIT}
            className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 text-neutral-300 disabled:opacity-40 hover:bg-neutral-700">Next</button>
        </div>
      )}
    </div>
  );
}
