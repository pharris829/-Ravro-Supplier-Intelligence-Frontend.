"use client";

import { useEffect, useState } from "react";
import { searchProducts, type Product } from "@/lib/api";

type SyncStatus = "synced" | "pending" | "error" | "unsynced";

interface SyncedProduct extends Product {
  syncStatus: SyncStatus;
  lastSynced?: string;
  store?: string;
}

const STORES = ["All Stores", "Shopify", "WooCommerce", "Etsy"];

function syncStatusStyle(s: SyncStatus): React.CSSProperties {
  const map = {
    synced:   { bg: "rgba(0,245,196,0.08)",  color: "var(--mint)",  border: "rgba(0,245,196,0.25)"  },
    pending:  { bg: "rgba(255,184,77,0.08)", color: "var(--amber)", border: "rgba(255,184,77,0.25)" },
    error:    { bg: "rgba(255,75,110,0.08)", color: "var(--red)",   border: "rgba(255,75,110,0.25)" },
    unsynced: { bg: "var(--surface3)",       color: "var(--text-dim)", border: "var(--border)"      },
  }[s];
  return { fontSize: 8, padding: "2px 7px", borderRadius: 2, background: map.bg, color: map.color, border: `1px solid ${map.border}`, letterSpacing: 0.5, textTransform: "capitalize" };
}

export default function InventoryPage() {
  const [products,     setProducts]     = useState<SyncedProduct[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [syncing,      setSyncing]      = useState<string | null>(null);
  const [storeFilter,  setStoreFilter]  = useState("All Stores");
  const [lastFullSync, setLastFullSync] = useState<string | null>(null);

  useEffect(() => {
    searchProducts({ q: "a", limit: 20 } as never).then(r => {
      const statuses: SyncStatus[] = ["synced", "synced", "pending", "unsynced", "error"];
      const stores = ["Shopify", "Shopify", "WooCommerce", "Etsy", "Shopify"];
      setProducts(r.products.map((p, i) => ({
        ...p,
        syncStatus: statuses[i % statuses.length],
        store: stores[i % stores.length],
        lastSynced: statuses[i % statuses.length] === "synced" ? new Date(Date.now() - i * 3600000).toISOString() : undefined,
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = storeFilter === "All Stores" ? products : products.filter(p => p.store === storeFilter);
  const counts = {
    synced:   products.filter(p => p.syncStatus === "synced").length,
    pending:  products.filter(p => p.syncStatus === "pending").length,
    error:    products.filter(p => p.syncStatus === "error").length,
    unsynced: products.filter(p => p.syncStatus === "unsynced").length,
  };

  function syncAll() {
    setSyncing("all");
    setTimeout(() => {
      setProducts(prev => prev.map(p => ({ ...p, syncStatus: "synced" as SyncStatus, lastSynced: new Date().toISOString() })));
      setLastFullSync(new Date().toISOString());
      setSyncing(null);
    }, 2000);
  }

  function syncOne(id: string) {
    setSyncing(id);
    setTimeout(() => {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, syncStatus: "synced" as SyncStatus, lastSynced: new Date().toISOString() } : p));
      setSyncing(null);
    }, 1200);
  }

  const statCards = [
    { label: "Synced",   value: counts.synced,   color: "var(--mint)"          },
    { label: "Pending",  value: counts.pending,  color: "var(--amber)"         },
    { label: "Errors",   value: counts.error,    color: "var(--red)"           },
    { label: "Unsynced", value: counts.unsynced, color: "var(--text-secondary)" },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">MERCHANT</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Inventory Sync</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
            {lastFullSync ? `Last full sync: ${new Date(lastFullSync).toLocaleString()}` : "Keep your storefronts in sync with supplier stock"}
          </p>
        </div>
        <button onClick={syncAll} disabled={syncing === "all"} style={{ background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: syncing === "all" ? 0.6 : 1 }}>
          {syncing === "all" ? "Syncing…" : "Sync All"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {statCards.map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4, width: "fit-content", marginBottom: 14 }}>
        {STORES.map(s => (
          <button key={s} onClick={() => setStoreFilter(s)} style={{
            padding: "4px 10px", borderRadius: 3, fontSize: 10, border: "none", cursor: "pointer",
            background: storeFilter === s ? "var(--mint)" : "transparent",
            color: storeFilter === s ? "var(--obsidian)" : "var(--text-secondary)",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Product","Store","Stock","Score","Status","Last Synced",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "28px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 14px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{p.product_name}</p>
                  <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>{p.category}</p>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.store}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: (p.stock_quantity ?? 0) < 10 ? "var(--red)" : "var(--text-secondary)" }}>{p.stock_quantity ?? 0}</span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{p.match_score?.toFixed(2) ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}><span style={syncStatusStyle(p.syncStatus)}>{p.syncStatus}</span></td>
                <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-dim)" }}>{p.lastSynced ? new Date(p.lastSynced).toLocaleTimeString() : "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <button onClick={() => syncOne(p.id)} disabled={syncing === p.id} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", opacity: syncing === p.id ? 0.4 : 1 }}>
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
