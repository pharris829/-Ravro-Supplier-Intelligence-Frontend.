"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiKeys, getWebhookEndpoints, type ApiChangelog } from "@/lib/api";

const ENDPOINTS = [
  { method: "GET",    path: "/api/v1/products",           desc: "List catalog products with filters and pagination" },
  { method: "GET",    path: "/api/v1/products/:id",        desc: "Get a single product by ID" },
  { method: "GET",    path: "/api/v1/products/:id/scores", desc: "Full scoring breakdown for a product" },
  { method: "GET",    path: "/api/v1/suppliers",           desc: "List suppliers with optional filters" },
  { method: "GET",    path: "/api/v1/suppliers/:id",       desc: "Get a single supplier profile" },
  { method: "GET",    path: "/api/v1/suppliers/:id/products", desc: "List a supplier's products" },
  { method: "GET",    path: "/api/v1/scores/top",          desc: "Top opportunity products this week" },
  { method: "GET",    path: "/api/v1/scores/trending",     desc: "Products trending upward by score" },
  { method: "GET",    path: "/api/v1/scores/niches",       desc: "Low-competition category niches" },
  { method: "GET",    path: "/api/v1/webhooks",            desc: "List registered webhook endpoints" },
  { method: "POST",   path: "/api/v1/webhooks",            desc: "Register a new webhook endpoint" },
  { method: "PATCH",  path: "/api/v1/webhooks/:id",        desc: "Update a webhook endpoint" },
  { method: "DELETE", path: "/api/v1/webhooks/:id",        desc: "Delete a webhook endpoint" },
  { method: "POST",   path: "/api/v1/webhooks/:id/test",   desc: "Send a test event to a webhook" },
];

const WEBHOOK_EVENTS = [
  "product.created", "product.scored", "product.updated",
  "supplier.created", "supplier.updated",
  "ingest.completed", "ingest.failed",
  "workflow.triggered", "workflow.failed",
  "subscription.upgraded", "subscription.cancelled",
];

const METHOD_COLOR: Record<string, string> = {
  GET:    "bg-blue-950 text-blue-400 border-blue-900",
  POST:   "bg-emerald-950 text-emerald-400 border-emerald-900",
  PATCH:  "bg-yellow-950 text-yellow-400 border-yellow-900",
  DELETE: "bg-red-950 text-red-400 border-red-900",
};

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
    // Fetch changelog from backend
    fetch("/api/developer/changelog").then(r => r.json()).then(d => setChangelog(d.changelog ?? [])).catch(() => {});
  }, []);

  function copySDK() {
    navigator.clipboard.writeText(SDK_EXAMPLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "overview",   label: "Overview"   },
    { key: "reference",  label: "API Reference" },
    { key: "sdk",        label: "SDK"        },
    { key: "changelog",  label: "Changelog"  },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Developer Portal</h1>
          <p className="text-sm text-neutral-400 mt-1">Public API · Webhooks · SDK · v1</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/api-keys"
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
            Manage API Keys
          </Link>
          <Link href="/developer/webhooks"
            className="text-sm px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors">
            Webhooks
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Active API Keys</p>
          <p className="text-2xl font-semibold text-white">{keyCount ?? "—"}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Webhook Endpoints</p>
          <p className="text-2xl font-semibold text-white">{webhookCount ?? "—"}</p>
        </div>
        <div className="bg-neutral-900 border border-indigo-900 rounded-xl p-4">
          <p className="text-xs text-indigo-400 mb-1">API Version</p>
          <p className="text-2xl font-semibold text-white">v1</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Base URL */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Base URL</h2>
            <code className="text-sm text-indigo-400 bg-neutral-800 rounded-lg px-3 py-2 block">
              https://api.ravro.com/api/v1
            </code>
            <p className="text-xs text-neutral-500 mt-2">All requests must include an <code className="text-indigo-400">X-API-Key</code> header with a key starting with <code className="text-indigo-400">rvk_</code>.</p>
          </div>

          {/* Auth */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Authentication</h2>
            <pre className="text-xs text-neutral-300 bg-neutral-800 rounded-lg p-3 overflow-x-auto">{`curl https://api.ravro.com/api/v1/products \\
  -H "X-API-Key: rvk_your_key_here"`}</pre>
            <p className="text-xs text-neutral-500 mt-2">
              Generate keys at{" "}
              <Link href="/settings/api-keys" className="text-indigo-400 hover:underline">Settings → API Keys</Link>.
            </p>
          </div>

          {/* Response format */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Response Format</h2>
            <pre className="text-xs text-neutral-300 bg-neutral-800 rounded-lg p-3 overflow-x-auto">{`{
  "data": [ ... ] | { ... },
  "meta": { "page": 1, "per_page": 20, "total": 143, "pages": 8 }
}`}</pre>
            <p className="text-xs text-neutral-500 mt-2">All responses include <code className="text-indigo-400">X-Ravro-API-Version</code> and <code className="text-indigo-400">X-Ravro-Request-Id</code> headers.</p>
          </div>

          {/* Webhook events */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Available Webhook Events</h2>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map(e => (
                <code key={e} className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">{e}</code>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              Each delivery is signed with <code className="text-indigo-400">X-Ravro-Signature: t=timestamp,v1=hmac_sha256</code> — verify before processing.
            </p>
          </div>
        </div>
      )}

      {/* API Reference */}
      {activeTab === "reference" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 w-20">Method</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Endpoint</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(ep => (
                <tr key={ep.path + ep.method} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white">{ep.path}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SDK */}
      {activeTab === "sdk" && (
        <div className="space-y-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Installation</h2>
            </div>
            <pre className="text-xs text-neutral-300 bg-neutral-800 rounded-lg p-3">npm install @ravro/sdk</pre>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Quick Start</h2>
              <button onClick={copySDK}
                className={`text-xs px-3 py-1 rounded-md border transition-colors ${copied ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700"}`}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="text-xs text-neutral-300 bg-neutral-800 rounded-lg p-3 overflow-x-auto leading-relaxed">
              {SDK_EXAMPLE}
            </pre>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Resources</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "ravro.products.list(params?)",           ret: "PaginatedResponse<Product>" },
                { label: "ravro.products.get(id)",                 ret: "{ data: Product }"           },
                { label: "ravro.products.scores(id)",              ret: "{ data: ScoreResult }"       },
                { label: "ravro.suppliers.list(params?)",          ret: "PaginatedResponse<Supplier>" },
                { label: "ravro.suppliers.get(id)",                ret: "{ data: Supplier }"          },
                { label: "ravro.suppliers.products(id, params?)",  ret: "PaginatedResponse<Product>" },
                { label: "ravro.scores.top(limit?)",               ret: "{ data: Product[] }"         },
                { label: "ravro.scores.trending(limit?)",          ret: "{ data: Product[] }"         },
                { label: "ravro.scores.niches(limit?)",            ret: "{ data: Niche[] }"           },
                { label: "ravro.webhooks.list()",                  ret: "{ data: WebhookEndpoint[] }" },
                { label: "ravro.webhooks.create(params)",          ret: "{ data: WebhookEndpoint }"   },
                { label: "ravro.webhooks.test(id)",                ret: "{ sent: boolean }"           },
              ].map(({ label, ret }) => (
                <div key={label} className="bg-neutral-800 rounded-lg p-3">
                  <code className="text-xs text-indigo-400 block mb-0.5">{label}</code>
                  <code className="text-xs text-neutral-500">→ {ret}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Changelog */}
      {activeTab === "changelog" && (
        <div className="space-y-3">
          {changelog.length === 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
              Loading changelog…
            </div>
          )}
          {changelog.map(entry => (
            <div key={entry.id} className={`bg-neutral-900 border rounded-xl px-5 py-4 ${entry.breaking ? "border-red-900" : "border-neutral-800"}`}>
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-bold text-white">{entry.version}</code>
                {entry.breaking && <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded">Breaking</span>}
                <span className="text-xs text-neutral-600">{new Date(entry.released_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-neutral-300 font-medium mb-0.5">{entry.title}</p>
              <p className="text-xs text-neutral-500">{entry.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
