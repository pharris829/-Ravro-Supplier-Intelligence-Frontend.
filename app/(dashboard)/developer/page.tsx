"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiKeys, getWebhookEndpoints, type ApiChangelog } from "@/lib/api";

const ENDPOINTS = [
  { method: "GET",    path: "/api/v1/products",              desc: "List catalog products with filters and pagination" },
  { method: "GET",    path: "/api/v1/products/:id",           desc: "Get a single product by ID"                       },
  { method: "GET",    path: "/api/v1/products/:id/scores",    desc: "Full scoring breakdown for a product"             },
  { method: "GET",    path: "/api/v1/suppliers",              desc: "List suppliers with optional filters"             },
  { method: "GET",    path: "/api/v1/suppliers/:id",          desc: "Get a single supplier profile"                    },
  { method: "GET",    path: "/api/v1/suppliers/:id/products", desc: "List a supplier's products"                       },
  { method: "GET",    path: "/api/v1/scores/top",             desc: "Top opportunity products this week"               },
  { method: "GET",    path: "/api/v1/scores/trending",        desc: "Products trending upward by score"                },
  { method: "GET",    path: "/api/v1/scores/niches",          desc: "Low-competition category niches"                  },
  { method: "GET",    path: "/api/v1/webhooks",               desc: "List registered webhook endpoints"                },
  { method: "POST",   path: "/api/v1/webhooks",               desc: "Register a new webhook endpoint"                  },
  { method: "PATCH",  path: "/api/v1/webhooks/:id",           desc: "Update a webhook endpoint"                        },
  { method: "DELETE", path: "/api/v1/webhooks/:id",           desc: "Delete a webhook endpoint"                        },
  { method: "POST",   path: "/api/v1/webhooks/:id/test",      desc: "Send a test event to a webhook"                   },
];

const WEBHOOK_EVENTS = [
  "product.created", "product.scored", "product.updated",
  "supplier.created", "supplier.updated",
  "ingest.completed", "ingest.failed",
  "workflow.triggered", "workflow.failed",
  "subscription.upgraded", "subscription.cancelled",
];

function methodStyle(m: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    GET:    { bg: "rgba(77,159,255,0.1)",  color: "var(--blue)",  border: "rgba(77,159,255,0.3)"  },
    POST:   { bg: "rgba(0,245,196,0.1)",   color: "var(--mint)",  border: "rgba(0,245,196,0.3)"   },
    PATCH:  { bg: "rgba(255,184,77,0.1)",  color: "var(--amber)", border: "rgba(255,184,77,0.3)"  },
    DELETE: { bg: "rgba(255,75,110,0.1)",  color: "var(--red)",   border: "rgba(255,75,110,0.3)"  },
  };
  const c = map[m] ?? map.GET;
  return { fontSize: 8, padding: "2px 7px", borderRadius: 2, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontWeight: 700, letterSpacing: 0.5 };
}

const SDK_EXAMPLE = `import Ravro from '@ravro/sdk';

const ravro = new Ravro({ apiKey: 'rvk_your_key_here' });

// Fetch top opportunity products
const { data } = await ravro.products.list({
  sort: 'match_score',
  min_score: 0.7,
  per_page: 10,
});

// Get trending scores
const trending = await ravro.scores.trending(5);

// Register a webhook
const endpoint = await ravro.webhooks.create({
  url: 'https://yourapp.com/ravro/webhook',
  events: ['product.scored', 'ingest.completed'],
});`;

export default function DeveloperPage() {
  const [keyCount,     setKeyCount]     = useState<number | null>(null);
  const [webhookCount, setWebhookCount] = useState<number | null>(null);
  const [activeTab,    setActiveTab]    = useState<"overview"|"reference"|"sdk"|"changelog">("overview");
  const [changelog,    setChangelog]    = useState<ApiChangelog[]>([]);
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    getApiKeys().then(r => setKeyCount(r.api_keys.filter(k => !k.revoked).length)).catch(() => {});
    getWebhookEndpoints().then(r => setWebhookCount(r.data.length)).catch(() => {});
    fetch("/api/developer/changelog").then(r => r.json()).then(d => setChangelog(d.changelog ?? [])).catch(() => {});
  }, []);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "overview",  label: "Overview"      },
    { key: "reference", label: "API Reference"  },
    { key: "sdk",       label: "SDK"            },
    { key: "changelog", label: "Changelog"      },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">DEVELOPER</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Developer Portal</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Public API · Webhooks · SDK · v1</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/settings/api-keys" style={{ fontSize: 11, padding: "7px 14px", borderRadius: 4, background: "var(--mint)", color: "var(--obsidian)", textDecoration: "none", fontWeight: 600 }}>Manage API Keys</Link>
          <Link href="/developer/webhooks" style={{ fontSize: 11, padding: "7px 14px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", textDecoration: "none" }}>Webhooks</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[{ label: "Active API Keys", value: keyCount ?? "—" }, { label: "Webhook Endpoints", value: webhookCount ?? "—" }, { label: "API Version", value: "v1", accent: true }].map(({ label, value, accent }) => (
          <div key={label} style={{ background: "var(--surface2)", border: `1px solid ${accent ? "var(--border-mint)" : "var(--border)"}`, borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: accent ? "var(--mint)" : "var(--text-dim)", marginBottom: 5 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, padding: "7px 0", borderRadius: 3, fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer",
            background: activeTab === t.key ? "var(--mint)" : "transparent",
            color: activeTab === t.key ? "var(--obsidian)" : "var(--text-secondary)",
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
            <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">BASE URL</div>
            <code style={{ fontSize: 11, color: "var(--mint)", background: "var(--surface3)", borderRadius: 4, padding: "8px 12px", display: "block" }}>
              https://api.ravro.com/api/v1
            </code>
            <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 8 }}>All requests must include an <code style={{ color: "var(--mint)", fontSize: 9 }}>X-API-Key</code> header with a key starting with <code style={{ color: "var(--mint)", fontSize: 9 }}>rvk_</code>.</p>
          </div>
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
            <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">AUTHENTICATION</div>
            <pre style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--surface3)", borderRadius: 4, padding: "10px 12px", margin: 0, overflow: "auto" }}>{`curl https://api.ravro.com/api/v1/products \\\n  -H "X-API-Key: rvk_your_key_here"`}</pre>
            <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 8 }}>Generate keys at <Link href="/settings/api-keys" style={{ color: "var(--mint)" }}>Settings → API Keys</Link>.</p>
          </div>
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
            <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">WEBHOOK EVENTS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {WEBHOOK_EVENTS.map(e => <code key={e} style={{ fontSize: 9, background: "var(--surface3)", color: "var(--text-secondary)", padding: "3px 7px", borderRadius: 3 }}>{e}</code>)}
            </div>
            <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 10 }}>Each delivery is signed with <code style={{ color: "var(--mint)", fontSize: 9 }}>X-Ravro-Signature: t=timestamp,v1=hmac_sha256</code> — verify before processing.</p>
          </div>
        </div>
      )}

      {activeTab === "reference" && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Method","Endpoint","Description"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(ep => (
                <tr key={ep.path + ep.method} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px" }}><span style={methodStyle(ep.method)}>{ep.method}</span></td>
                  <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 10, color: "var(--text-primary)" }}>{ep.path}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-secondary)" }}>{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "sdk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
            <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">INSTALLATION</div>
            <pre style={{ fontSize: 11, color: "var(--mint)", background: "var(--surface3)", borderRadius: 4, padding: "10px 12px", margin: 0 }}>npm install @ravro/sdk</pre>
          </div>
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)" }} className="font-orbitron">QUICK START</div>
              <button onClick={() => { navigator.clipboard.writeText(SDK_EXAMPLE); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: copied ? "rgba(0,245,196,0.08)" : "var(--surface3)", color: copied ? "var(--mint)" : "var(--text-secondary)", border: `1px solid ${copied ? "var(--border-mint)" : "var(--border)"}`, cursor: "pointer" }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre style={{ fontSize: 10, color: "var(--text-secondary)", background: "var(--surface3)", borderRadius: 4, padding: "12px", margin: 0, overflow: "auto", lineHeight: 1.7 }}>{SDK_EXAMPLE}</pre>
          </div>
        </div>
      )}

      {activeTab === "changelog" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {changelog.length === 0 && (
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>
              Loading changelog…
            </div>
          )}
          {changelog.map(entry => (
            <div key={entry.id} style={{ background: "var(--surface2)", border: `1px solid ${entry.breaking ? "rgba(255,75,110,0.3)" : "var(--border)"}`, borderRadius: 4, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <code style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{entry.version}</code>
                {entry.breaking && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 2, background: "rgba(255,75,110,0.08)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.25)" }}>Breaking</span>}
                <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{new Date(entry.released_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{entry.title}</p>
              <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: "4px 0 0" }}>{entry.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
