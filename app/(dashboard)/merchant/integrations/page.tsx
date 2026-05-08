"use client";

import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected";
  store?: string;
  syncedProducts?: number;
  lastSync?: string;
  color: string;
}

const INITIAL: Integration[] = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync products and inventory directly to your Shopify storefront.",
    status: "disconnected",
    color: "bg-green-600",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Push catalog updates and stock levels to WooCommerce automatically.",
    status: "disconnected",
    color: "bg-purple-600",
  },
  {
    id: "etsy",
    name: "Etsy",
    description: "List products on Etsy and keep inventory in sync with supplier data.",
    status: "disconnected",
    color: "bg-orange-600",
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL);
  const [connecting, setConnecting]     = useState<string | null>(null);
  const [configuring, setConfiguring]   = useState<string | null>(null);
  const [storeUrl, setStoreUrl]         = useState("");

  function connect(id: string) {
    if (!storeUrl.trim()) return;
    setConnecting(id);
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => i.id === id
        ? { ...i, status: "connected", store: storeUrl, syncedProducts: 0, lastSync: new Date().toISOString() }
        : i));
      setConnecting(null);
      setConfiguring(null);
      setStoreUrl("");
    }, 1500);
  }

  function disconnect(id: string) {
    setIntegrations(prev => prev.map(i => i.id === id
      ? { ...i, status: "disconnected", store: undefined, syncedProducts: undefined, lastSync: undefined }
      : i));
  }

  const connected    = integrations.filter(i => i.status === "connected");
  const disconnected = integrations.filter(i => i.status === "disconnected");

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Storefront Integrations</h1>
        <p className="text-sm text-neutral-400 mt-1">Connect your stores to sync Ravro's catalog and inventory data</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Connected",    value: connected.length    },
          { label: "Disconnected", value: disconnected.length },
          { label: "Products Synced", value: connected.reduce((s, i) => s + (i.syncedProducts ?? 0), 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {integrations.map(integration => (
          <div key={integration.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${integration.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                  {integration.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      integration.status === "connected"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-900"
                        : "bg-neutral-800 text-neutral-500 border-neutral-700"
                    }`}>
                      {integration.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{integration.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {integration.status === "connected" ? (
                  <>
                    <button
                      className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                      Settings
                    </button>
                    <button onClick={() => disconnect(integration.id)}
                      className="text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 transition-colors">
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfiguring(configuring === integration.id ? null : integration.id)}
                    className="text-xs px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Connected details */}
            {integration.status === "connected" && (
              <div className="mt-4 pt-4 border-t border-neutral-800 flex gap-6 text-xs text-neutral-500">
                <span>Store: <span className="text-neutral-300">{integration.store}</span></span>
                <span>Products synced: <span className="text-neutral-300">{integration.syncedProducts}</span></span>
                <span>Last sync: <span className="text-neutral-300">{integration.lastSync ? new Date(integration.lastSync).toLocaleString() : "Never"}</span></span>
              </div>
            )}

            {/* Connect form */}
            {configuring === integration.id && integration.status === "disconnected" && (
              <div className="mt-4 pt-4 border-t border-neutral-800 flex gap-3">
                <input
                  value={storeUrl}
                  onChange={e => setStoreUrl(e.target.value)}
                  placeholder={`Your ${integration.name} store URL`}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={() => connect(integration.id)} disabled={connecting === integration.id || !storeUrl.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                  {connecting === integration.id ? "Connecting…" : "Confirm"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
