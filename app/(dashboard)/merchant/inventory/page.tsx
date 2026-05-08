"use client";

import { useEffect, useState } from "react";
import { searchProducts, type Product } from "@/lib/api";

type SyncStatus = "synced" | "pending" | "error" | "unsynced";

interface SyncedProduct extends Product {
  syncStatus: SyncStatus;
  lastSynced?: string;
  store?: string;
}

const STATUS_STYLES: Record<SyncStatus, string> = {
  synced:   "bg-emerald-950 text-emerald-400 border-emerald-900",
  pending:  "bg-yellow-950 text-yellow-400 border-yellow-900",
  error:    "bg-red-950 text-red-400 border-red-900",
  unsynced: "bg-neutral-800 text-neutral-500 border-neutral-700",
};

const STORES = ["All Stores", "Shopify", "WooCommerce", "Etsy"];

export default function InventoryPage() {
  const [products, setProducts]     = useState<SyncedProduct[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState("All Stores");
  const [lastFullSync, setLastFullSync] = useState<string | null>(null);

  useEffect(() => {
    searchProducts({ q: "a", limit: 20 } as never).then(r => {
      const statuses: SyncStatus[] = ["synced", "synced", "pending", "unsynced", "error"];
      const stores = ["Shopify", "Shopify", "WooCommerce", "Etsy", "Shopify"];
      const mapped: SyncedProduct[] = r.products.map((p, i) => ({
        ...p,
        syncStatus: statuses[i % statuses.length],
        store: stores[i % stores.length],
        lastSynced: statuses[i % statuses.length] === "synced"
          ? new Date(Date.now() - i * 3600000).toISOString()
          : undefined,
      }));
      setProducts(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = storeFilter === "All Stores"
    ? products
    : products.filter(p => p.store === storeFilter);

  const counts = {
    synced:   products.filter(p => p.syncStatus === "synced").length,
    pending:  products.filter(p => p.syncStatus === "pending").length,
    error:    products.filter(p => p.syncStatus === "error").length,
    unsynced: products.filter(p => p.syncStatus === "unsynced").length,
  };

  function syncAll() {
    setSyncing("all");
    setTimeout(() => {
      setProducts(prev => prev.map(p => ({ ...p, syncStatus: "synced", lastSynced: new Date().toISOString() })));
      setLastFullSync(new Date().toISOString());
      setSyncing(null);
    }, 2000);
  }

  function syncOne(id: string) {
    setSyncing(id);
    setTimeout(() => {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, syncStatus: "synced", lastSynced: new Date().toISOString() } : p));
      setSyncing(null);
    }, 1200);
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Inventory Sync</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {lastFullSync ? `Last full sync: ${new Date(lastFullSync).toLocaleString()}` : "Keep your storefronts in sync with supplier stock"}
          </p>
        </div>
        <button onClick={syncAll} disabled={syncing === "all"}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {syncing === "all" ? "Syncing…" : "Sync All"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Synced",   value: counts.synced,   color: "text-emerald-400" },
          { label: "Pending",  value: counts.pending,  color: "text-yellow-400"  },
          { label: "Errors",   value: counts.error,    color: "text-red-400"     },
          { label: "Unsynced", value: counts.unsynced, color: "text-neutral-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit mb-4">
        {STORES.map(s => (
          <button key={s} onClick={() => setStoreFilter(s)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${storeFilter === s ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Product", "Store", "Stock", "Score", "Status", "Last Synced", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">Loading…</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white font-medium text-sm">{p.product_name}</p>
                  <p className="text-xs text-neutral-600">{p.category}</p>
                </td>
                <td className="px-4 py-3 text-neutral-400 text-xs">{p.store}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${(p.stock_quantity ?? 0) < 10 ? "text-red-400" : "text-neutral-300"}`}>
                    {p.stock_quantity ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300 text-xs tabular-nums">
                  {p.match_score?.toFixed(2) ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[p.syncStatus]}`}>
                    {p.syncStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">
                  {p.lastSynced ? new Date(p.lastSynced).toLocaleTimeString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => syncOne(p.id)} disabled={syncing === p.id}
                    className="text-xs px-3 py-1 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 transition-colors">
                    {syncing === p.id ? "…" : "Sync"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
