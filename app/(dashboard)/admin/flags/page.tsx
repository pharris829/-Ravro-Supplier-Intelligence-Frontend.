"use client";

import { useEffect, useState } from "react";
import { getAdminFlags, updateAdminFlag } from "@/lib/api";
import { setFlagsCache } from "@/lib/flags";

interface Flag { key: string; label: string; description: string; enabled: boolean; group: string; }

const META: Record<string, { label: string; description: string; group: string }> = {
  scoring_enabled:          { label: "Scoring Engine",           description: "Run opportunity scoring on ingested products.",             group: "Core"         },
  csv_strict_validation:    { label: "Strict CSV Validation",    description: "Reject rows with missing optional fields.",                 group: "Core"         },
  opportunity_tier_badges:  { label: "Opportunity Tier Badges",  description: "Show high/medium/low tier badges in the product UI.",       group: "UI"           },
  merchant_access_requests: { label: "Merchant Access Requests", description: "Allow merchants to request catalog access from suppliers.", group: "UI"           },
  supplier_analytics:       { label: "Supplier Analytics",       description: "Enable the supplier analytics dashboard.",                  group: "UI"           },
  shopify_sync:             { label: "Shopify Sync",             description: "Enable Shopify integration for inventory sync.",            group: "Integrations" },
  woo_sync:                 { label: "WooCommerce Sync",         description: "Enable WooCommerce integration. (Backend not yet built)",   group: "Integrations" },
  etsy_sync:                { label: "Etsy Sync",                description: "Enable Etsy integration. (Backend not yet built)",         group: "Integrations" },
  billing_module:           { label: "Billing Module",           description: "Show billing and usage pages to merchants.",               group: "Billing"      },
  paid_plans:               { label: "Paid Plans",               description: "Enable upgrade flow and plan selection.",                   group: "Billing"      },
  rate_limiting:            { label: "Rate Limiting",            description: "Apply per-IP rate limits on auth and upload routes.",       group: "Security"     },
  debug_mode:               { label: "Debug Mode",               description: "Log verbose stack traces in server error output.",         group: "Security"     },
};

export default function AdminFlagsPage() {
  const [flags,   setFlags]   = useState<Flag[]>([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getAdminFlags()
      .then(({ flags: raw }) => {
        const mapped = raw.map(f => ({
          ...f,
          label:       META[f.key]?.label       ?? f.key,
          description: META[f.key]?.description ?? "",
          group:       META[f.key]?.group        ?? "Other",
        }));
        setFlags(mapped);
        syncCache(mapped);
      })
      .catch(() => setError("Could not load flags from server."))
      .finally(() => setLoading(false));
  }, []);

  function syncCache(f: Flag[]) {
    setFlagsCache(Object.fromEntries(f.map(x => [x.key, x.enabled])));
  }

  async function toggle(key: string) {
    const flag = flags.find(f => f.key === key);
    if (!flag) return;
    const next = !flag.enabled;
    const updated = flags.map(f => f.key === key ? { ...f, enabled: next } : f);
    setFlags(updated);
    syncCache(updated);
    try {
      await updateAdminFlag(key, next);
    } catch {
      // Revert on failure
      const reverted = flags.map(f => f.key === key ? { ...f, enabled: flag.enabled } : f);
      setFlags(reverted);
      syncCache(reverted);
    }
  }

  async function setAll(enabled: boolean) {
    const updated = flags.map(f => ({ ...f, enabled }));
    setFlags(updated);
    syncCache(updated);
    await Promise.allSettled(flags.map(f => updateAdminFlag(f.key, enabled)));
  }

  const groups = [...new Set(flags.map(f => f.group))];
  const filtered = flags.filter(f =>
    !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase())
  );
  const enabledCount = flags.filter(f => f.enabled).length;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ADMIN</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Feature Flags</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{enabledCount} of {flags.length} enabled</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setAll(true)}  style={{ fontSize: 10, padding: "5px 12px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>Enable all</button>
          <button type="button" onClick={() => setAll(false)} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>Disable all</button>
        </div>
      </div>

      {error && <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 12 }}>{error}</p>}

      <input type="text" placeholder="Search flags…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "var(--text-primary)", outline: "none", marginBottom: 20, boxSizing: "border-box" }} />

      {loading ? (
        <p style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", padding: 32 }}>Loading…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {groups.map(group => {
            const groupFlags = filtered.filter(f => f.group === group);
            if (groupFlags.length === 0) return null;
            return (
              <div key={group}>
                <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 8 }} className="font-orbitron">{group.toUpperCase()}</div>
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4 }}>
                  {groupFlags.map((flag, i) => (
                    <div key={flag.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < groupFlags.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{flag.label}</p>
                          <code style={{ fontSize: 9, color: "var(--text-dim)" }}>{flag.key}</code>
                        </div>
                        <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0 }}>{flag.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggle(flag.key)}
                        aria-label={`${flag.enabled ? "Disable" : "Enable"} ${flag.label}`}
                        aria-pressed={flag.enabled ? "true" : "false"}
                        style={{
                          position: "relative", width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
                          background: flag.enabled ? "var(--mint)" : "var(--surface3)",
                          transition: "background 0.2s",
                        }}
                      >
                        <span style={{
                          position: "absolute", top: 2, left: flag.enabled ? 18 : 2,
                          width: 16, height: 16, borderRadius: "50%", background: flag.enabled ? "var(--obsidian)" : "var(--text-dim)",
                          transition: "left 0.2s",
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
