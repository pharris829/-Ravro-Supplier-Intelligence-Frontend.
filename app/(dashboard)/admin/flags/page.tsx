"use client";

import { useEffect, useState } from "react";

interface Flag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  group: string;
}

const DEFAULTS: Flag[] = [
  { key: "scoring_enabled",          label: "Scoring Engine",            description: "Run opportunity scoring on ingested products.",             enabled: true,  group: "Core" },
  { key: "csv_strict_validation",    label: "Strict CSV Validation",     description: "Reject rows with missing optional fields.",                 enabled: false, group: "Core" },
  { key: "opportunity_tier_badges",  label: "Opportunity Tier Badges",   description: "Show high/medium/low tier badges in the product UI.",       enabled: true,  group: "UI"   },
  { key: "merchant_access_requests", label: "Merchant Access Requests",  description: "Allow merchants to request catalog access from suppliers.", enabled: true,  group: "UI"   },
  { key: "supplier_analytics",       label: "Supplier Analytics",        description: "Enable the supplier analytics dashboard.",                  enabled: true,  group: "UI"   },
  { key: "shopify_sync",             label: "Shopify Sync",              description: "Enable Shopify integration for inventory sync.",            enabled: false, group: "Integrations" },
  { key: "woo_sync",                 label: "WooCommerce Sync",          description: "Enable WooCommerce integration.",                           enabled: false, group: "Integrations" },
  { key: "etsy_sync",                label: "Etsy Sync",                 description: "Enable Etsy integration.",                                 enabled: false, group: "Integrations" },
  { key: "billing_module",           label: "Billing Module",            description: "Show billing and usage pages to merchants.",               enabled: true,  group: "Billing" },
  { key: "paid_plans",               label: "Paid Plans",                description: "Enable upgrade flow and plan selection.",                   enabled: false, group: "Billing" },
  { key: "rate_limiting",            label: "Rate Limiting",             description: "Apply per-IP rate limits on auth and upload routes.",       enabled: true,  group: "Security" },
  { key: "debug_mode",               label: "Debug Mode",                description: "Log verbose errors to the console.",                       enabled: false, group: "Security" },
];

const STORAGE_KEY = "ravro_feature_flags";

function loadFlags(): Flag[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored) return DEFAULTS;
    return DEFAULTS.map(d => ({ ...d, enabled: stored[d.key] ?? d.enabled }));
  } catch { return DEFAULTS; }
}

function saveFlags(flags: Flag[]) {
  const map = Object.fromEntries(flags.map(f => [f.key, f.enabled]));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export default function AdminFlagsPage() {
  const [flags, setFlags]   = useState<Flag[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { setFlags(loadFlags()); }, []);

  function toggle(key: string) {
    const updated = flags.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f);
    setFlags(updated);
    saveFlags(updated);
  }

  const groups = [...new Set(flags.map(f => f.group))];
  const filtered = flags.filter(f => !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()));

  const enabledCount = flags.filter(f => f.enabled).length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Feature Flags</h1>
          <p className="text-sm text-neutral-400 mt-1">{enabledCount} of {flags.length} enabled</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const u = flags.map(f => ({ ...f, enabled: true })); setFlags(u); saveFlags(u); }}
            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">Enable all</button>
          <button onClick={() => { const u = flags.map(f => ({ ...f, enabled: false })); setFlags(u); saveFlags(u); }}
            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">Disable all</button>
        </div>
      </div>

      <input type="text" placeholder="Search flags…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 mb-6" />

      <div className="space-y-6">
        {groups.map(group => {
          const groupFlags = filtered.filter(f => f.group === group);
          if (groupFlags.length === 0) return null;
          return (
            <div key={group}>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-1">{group}</p>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
                {groupFlags.map(flag => (
                  <div key={flag.key} className="flex items-center justify-between px-5 py-4">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{flag.label}</p>
                        <code className="text-xs text-neutral-600">{flag.key}</code>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{flag.description}</p>
                    </div>
                    <button onClick={() => toggle(flag.key)}
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${flag.enabled ? "bg-red-600" : "bg-neutral-700"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${flag.enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
