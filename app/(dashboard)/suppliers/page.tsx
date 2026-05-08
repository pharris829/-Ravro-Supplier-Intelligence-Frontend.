"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSuppliers, type Supplier } from "@/lib/api";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getSuppliers({ page, limit: 20 })
      .then((r) => { setSuppliers(r.suppliers); setPagination(r.pagination); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Suppliers</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{pagination.total} total</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="text-neutral-500 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/suppliers/${s.id}`}
              className="flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-indigo-600 rounded-xl px-5 py-4 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-white group-hover:text-indigo-400">{s.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {s.categories?.join(", ") || "—"} · {s.country || "—"}
                </p>
              </div>
              <div className="text-right text-xs text-neutral-400 space-y-0.5">
                <p>Trust <span className="text-white font-medium">{s.trust_score ?? "—"}</span></p>
                <p>Products <span className="text-white font-medium">{s.product_count ?? "—"}</span></p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 text-neutral-300 disabled:opacity-40 hover:bg-neutral-700"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-xs text-neutral-500">
            {page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-3 py-1.5 text-xs rounded-md bg-neutral-800 text-neutral-300 disabled:opacity-40 hover:bg-neutral-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
