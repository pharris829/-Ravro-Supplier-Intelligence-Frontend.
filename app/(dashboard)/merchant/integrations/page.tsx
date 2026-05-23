"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getShopifyStores, startShopifyInstall, syncShopifyStore, disconnectShopifyStore,
  type ShopifyStore, type ShopifySyncResult,
} from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getFlag } from "@/lib/flags";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span style={{
      fontSize: 8, padding: "2px 7px", borderRadius: 2, letterSpacing: 0.5,
      background: connected ? "rgba(0,245,196,0.08)" : "var(--surface3)",
      color: connected ? "var(--mint)" : "var(--text-dim)",
      border: `1px solid ${connected ? "var(--border-mint)" : "var(--border)"}`,
    }}>
      {connected ? "CONNECTED" : "DISCONNECTED"}
    </span>
  );
}

// ─── Sync result panel ────────────────────────────────────────────────────────
function SyncResult({ result }: { result: ShopifySyncResult }) {
  const hasErrors = (result.errors?.length ?? 0) > 0;
  return (
    <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 4, background: "rgba(0,245,196,0.04)", border: "1px solid var(--border-mint)" }}>
      <div style={{ display: "flex", gap: 20, marginBottom: hasErrors ? 10 : 0 }}>
        {[
          { label: "Synced",  value: result.synced,  color: "var(--mint)"  },
          { label: "Failed",  value: result.failed,  color: result.failed  > 0 ? "var(--red)"   : "var(--text-dim)" },
          { label: "Total",   value: result.total,   color: "var(--text-secondary)" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
        {result.message && (
          <div style={{ fontSize: 10, color: "var(--text-secondary)", alignSelf: "center" }}>{result.message}</div>
        )}
      </div>
      {hasErrors && (
        <div style={{ maxHeight: 100, overflowY: "auto" }}>
          {result.errors!.map((e, i) => (
            <p key={i} style={{ fontSize: 9, color: "var(--red)", margin: "2px 0", fontFamily: "monospace" }}>
              {e.name}: {e.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Connected store row ──────────────────────────────────────────────────────
function StoreRow({ store, onDisconnect }: { store: ShopifyStore; onDisconnect: () => void }) {
  const [syncing,    setSyncing]    = useState(false);
  const [syncResult, setSyncResult] = useState<ShopifySyncResult | null>(null);
  const [syncError,  setSyncError]  = useState("");

  async function handleSync() {
    setSyncing(true); setSyncResult(null); setSyncError("");
    try {
      const result = await syncShopifyStore(store.shop);
      setSyncResult(result);
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally { setSyncing(false); }
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${store.shop}? Products already pushed to Shopify will remain there.`)) return;
    await disconnectShopifyStore(store.shop);
    onDisconnect();
  }

  return (
    <div style={{ background: "var(--surface3)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: syncResult || syncError ? 0 : 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{store.shop}</span>
            <StatusBadge connected />
          </div>
          <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>
            Connected {new Date(store.installed_at).toLocaleDateString()} · Last updated {new Date(store.updated_at).toLocaleString()}
          </p>
          {store.scope && (
            <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "3px 0 0" }}>
              Scopes: {store.scope.split(",").slice(0, 4).join(", ")}{store.scope.split(",").length > 4 ? "…" : ""}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 16 }}>
          <button type="button" onClick={handleSync} disabled={syncing} style={{
            background: "var(--mint)", color: "var(--obsidian)", border: "none",
            borderRadius: 4, padding: "7px 16px", fontSize: 11, fontWeight: 600,
            cursor: syncing ? "not-allowed" : "pointer", opacity: syncing ? 0.7 : 1,
          }}>
            {syncing ? "Syncing…" : "↺ Sync Now"}
          </button>
          <button type="button" onClick={handleDisconnect} style={{
            fontSize: 10, padding: "7px 12px", borderRadius: 4, cursor: "pointer",
            background: "rgba(255,75,110,0.08)", color: "var(--red)",
            border: "1px solid rgba(255,75,110,0.25)",
          }}>Disconnect</button>
        </div>
      </div>
      {syncError  && <p style={{ fontSize: 10, color: "var(--red)", marginTop: 10 }}>{syncError}</p>}
      {syncResult && <SyncResult result={syncResult} />}
    </div>
  );
}

// ─── Connect form ─────────────────────────────────────────────────────────────
function ConnectForm({ onConnected }: { onConnected: () => void }) {
  const [shop,       setShop]       = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error,      setError]      = useState("");

  // Extract the myshopify.com domain from whatever the user pastes —
  // handles full URLs, admin URLs, bare subdomains, or just the store name.
  function parseShopDomain(raw: string): string | null {
    const s = raw.trim().toLowerCase();
    if (!s) return null;

    // Already a valid myshopify.com domain
    if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s)) return s;

    // Full URL containing myshopify.com — extract host
    try {
      const url = new URL(s.startsWith("http") ? s : `https://${s}`);
      if (url.hostname.endsWith(".myshopify.com")) return url.hostname;
    } catch { /* not a URL */ }

    // Bare store name with no dots — append .myshopify.com
    if (/^[a-z0-9][a-z0-9-]*$/.test(s)) return `${s}.myshopify.com`;

    return null;
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = parseShopDomain(shop);
    if (!normalized) {
      setError("Couldn't find a myshopify.com domain in what you entered. Paste just your store name (e.g. mystore) or mystore.myshopify.com");
      return;
    }
    setConnecting(true);
    try {
      const { auth_url } = await startShopifyInstall(normalized);
      window.location.href = auth_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start OAuth");
      setConnecting(false);
    }
  }

  const preview = parseShopDomain(shop);

  return (
    <form onSubmit={handleConnect} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <input
          value={shop}
          onChange={e => { setShop(e.target.value); setError(""); }}
          placeholder="mystore  — or paste your mystore.myshopify.com URL"
          style={{
            flex: 1, background: "var(--surface3)", border: `1px solid ${error ? "rgba(255,75,110,0.4)" : "var(--border)"}`,
            borderRadius: 4, padding: "8px 12px", fontSize: 11,
            color: "var(--text-primary)", outline: "none",
          }}
        />
        <button type="submit" disabled={connecting || !shop.trim()} style={{
          background: "var(--mint)", color: "var(--obsidian)", border: "none",
          borderRadius: 4, padding: "8px 18px", fontSize: 11, fontWeight: 600,
          cursor: connecting || !shop.trim() ? "not-allowed" : "pointer",
          opacity: connecting || !shop.trim() ? 0.6 : 1, flexShrink: 0,
        }}>
          {connecting ? "Redirecting…" : "Connect Shopify"}
        </button>
      </div>
      {/* Live preview of resolved domain */}
      {preview && !error && (
        <p style={{ fontSize: 10, color: "var(--mint)", margin: 0 }}>
          → Will connect to <strong>{preview}</strong>
        </p>
      )}
      {error && (
        <div style={{ fontSize: 10, color: "var(--red)", margin: 0 }}>
          <p style={{ margin: "0 0 4px" }}>{error}</p>
          <p style={{ margin: 0, color: "var(--text-dim)" }}>
            Find your .myshopify.com domain in your Shopify admin → Settings → Domains.
          </p>
        </div>
      )}
    </form>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────
function IntegrationsContent() {
  const searchParams  = useSearchParams();
  const [stores,      setStores]      = useState<ShopifyStore[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setStores((await getShopifyStores()).stores); }
    catch { /* not connected yet */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    if (searchParams.get("shopify") === "connected") {
      const shop = searchParams.get("shop");
      showToast(`${shop ?? "Shopify"} connected! Starting initial sync…`, true);
    }
  }, [load, searchParams]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  const hasStores = stores.length > 0;

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">MERCHANT</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Storefront Integrations</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
          Connect your Shopify store to sync Ravro&apos;s catalog and push products automatically.
        </p>
      </div>

      {toast && (
        <div style={{
          padding: "10px 14px", borderRadius: 4, marginBottom: 16, fontSize: 11,
          background: toast.ok ? "rgba(0,245,196,0.06)" : "rgba(255,75,110,0.06)",
          border: `1px solid ${toast.ok ? "rgba(0,245,196,0.25)" : "rgba(255,75,110,0.25)"}`,
          color: toast.ok ? "var(--mint)" : "var(--red)",
        }}>{toast.msg}</div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}>
        {[
          { label: "Connected Stores", value: stores.length,           color: "var(--mint)"          },
          { label: "Platform",         value: "Shopify",               color: "var(--text-primary)"  },
          { label: "Sync Direction",   value: "Ravro → Shopify",       color: "var(--text-secondary)"},
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5 }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Connected stores */}
      {loading ? (
        <div style={{ padding: "20px 0", fontSize: 11, color: "var(--text-dim)" }}>Loading…</div>
      ) : hasStores ? (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">
            CONNECTED STORES
          </div>
          {stores.map(store => (
            <StoreRow key={store.id} store={store} onDisconnect={load} />
          ))}
        </div>
      ) : null}

      {/* Connect new store */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 4, background: "rgba(0,245,196,0.1)", border: "1px solid var(--border-mint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--mint)", flexShrink: 0 }}>S</div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Shopify</h3>
            <p style={{ fontSize: 10, color: "var(--text-dim)", margin: 0 }}>Push supplier products from Ravro directly into your Shopify catalog.</p>
          </div>
        </div>
        {getFlag("shopify_sync") ? (
          <ConnectForm onConnected={load} />
        ) : (
          <p style={{ fontSize: 11, color: "var(--text-dim)", padding: "10px 0" }}>
            Shopify Sync is disabled. Enable the <code>shopify_sync</code> feature flag in Admin → Feature Flags to connect a store.
          </p>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 7, letterSpacing: 1.5, color: "var(--text-dim)", marginBottom: 8 }} className="font-orbitron">HOW IT WORKS</div>
          {[
            "Click Connect Shopify and approve the app in your store",
            "Ravro fetches all ingested catalog products scored for your merchant profile",
            "Products are created/updated in your Shopify store with pricing and inventory",
            "Click Sync Now any time to push the latest catalog changes",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ fontSize: 8, color: "var(--mint)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div style={{ fontSize: 11, color: "var(--text-dim)", padding: 16 }}>Loading…</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
