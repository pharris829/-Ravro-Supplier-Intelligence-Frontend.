"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getWebhookEndpoints, createWebhookEndpoint, updateWebhookEndpoint,
  deleteWebhookEndpoint, testWebhookEndpoint, getWebhookDeliveries,
  type WebhookEndpoint, type WebhookDelivery,
} from "@/lib/api";

const ALL_EVENTS = [
  "product.created", "product.scored", "product.updated",
  "supplier.created", "supplier.updated",
  "ingest.completed", "ingest.failed",
  "workflow.triggered", "workflow.failed",
  "subscription.upgraded", "subscription.cancelled",
];

const STATUS_STYLE: Record<string, string> = {
  delivered: "text-emerald-400",
  failed:    "text-red-400",
  retrying:  "text-yellow-400",
  pending:   "text-neutral-500",
};

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [availEvents, setAvailEvents] = useState<string[]>(ALL_EVENTS);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [url,       setUrl]       = useState("");
  const [desc,      setDesc]      = useState("");
  const [events,    setEvents]    = useState<string[]>(["product.scored"]);
  const [creating,  setCreating]  = useState(false);
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);
  const [deliveries, setDeliveries] = useState<{ id: string; rows: WebhookDelivery[] } | null>(null);
  const [testing,   setTesting]   = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toggling,  setToggling]  = useState<string | null>(null);

  async function load() {
    const r = await getWebhookEndpoints().catch(() => null);
    if (r) { setEndpoints(r.data); setAvailEvents(r.available_events); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim() || events.length === 0) return;
    setCreating(true);
    try {
      const r = await createWebhookEndpoint({ url, description: desc || undefined, events });
      if (r.data.secret) setNewSecret({ id: r.data.id, secret: r.data.secret });
      await load();
      setShowForm(false); setUrl(""); setDesc(""); setEvents(["product.scored"]);
    } finally { setCreating(false); }
  }

  async function handleToggle(ep: WebhookEndpoint) {
    setToggling(ep.id);
    await updateWebhookEndpoint(ep.id, { enabled: !ep.enabled });
    await load();
    setToggling(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    setDeleting(id);
    await deleteWebhookEndpoint(id);
    await load();
    setDeleting(null);
  }

  async function handleTest(id: string) {
    setTesting(id);
    await testWebhookEndpoint(id).catch(() => {});
    setTesting(null);
  }

  async function loadDeliveries(id: string) {
    if (deliveries?.id === id) { setDeliveries(null); return; }
    const r = await getWebhookDeliveries(id).catch(() => null);
    if (r) setDeliveries({ id, rows: r.data });
  }

  function toggleEvent(ev: string) {
    setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  }

  return (
    <div className="max-w-4xl">
      <Link href="/developer" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Developer Portal</Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Webhooks</h1>
          <p className="text-sm text-neutral-400 mt-1">Receive real-time event notifications via HTTP POST</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={showForm}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Register endpoint
        </button>
      </div>

      {/* Secret reveal */}
      {newSecret && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-emerald-400 mb-2">⚠ Save your signing secret — it won't be shown again</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-white font-mono break-all">{newSecret.secret}</code>
            <button onClick={() => { navigator.clipboard.writeText(newSecret.secret); }}
              className="shrink-0 text-xs px-3 py-2 rounded border bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700">Copy</button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">Verify deliveries with <code className="text-indigo-400">X-Ravro-Signature: t=timestamp,v1=hmac_sha256_hex</code></p>
          <button onClick={() => setNewSecret(null)} className="text-xs text-neutral-500 hover:text-neutral-300 mt-2">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-neutral-900 border border-indigo-800 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Register Webhook Endpoint</h2>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Endpoint URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://yourapp.com/webhooks/ravro"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Description (optional)</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Production webhook"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Subscribe to events *</label>
            <div className="grid grid-cols-2 gap-2">
              {availEvents.map(ev => (
                <label key={ev} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-colors ${events.includes(ev) ? "border-indigo-600 bg-indigo-950/30 text-white" : "border-neutral-700 text-neutral-500"}`}>
                  <input type="checkbox" checked={events.includes(ev)} onChange={() => toggleEvent(ev)} className="accent-indigo-500" />
                  <code>{ev}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={creating || !url.trim() || events.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              {creating ? "Registering…" : "Register"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-neutral-400 hover:text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Endpoint list */}
      {loading ? <div className="text-neutral-500 text-sm">Loading…</div> :
       endpoints.length === 0 && !showForm ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
          <p className="text-neutral-400 text-sm">No webhook endpoints registered.</p>
          <p className="text-neutral-600 text-xs mt-1">Register an endpoint to start receiving events from Ravro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map(ep => (
            <div key={ep.id}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${ep.enabled ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-neutral-800 text-neutral-500 border-neutral-700"}`}>
                        {ep.enabled ? "Active" : "Disabled"}
                      </span>
                      {(ep.failure_count ?? 0) > 0 && (
                        <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded">
                          {ep.failure_count} failed
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-white truncate">{ep.url}</p>
                    {ep.description && <p className="text-xs text-neutral-500 mt-0.5">{ep.description}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ep.events.map(ev => <code key={ev} className="text-xs bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">{ev}</code>)}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-neutral-600">
                      <span>Secret: <code className="text-neutral-500">{ep.secret_hint}</code></span>
                      <span>Deliveries: <span className="text-neutral-400">{ep.delivery_count ?? 0}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => loadDeliveries(ep.id)}
                      className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                      {deliveries?.id === ep.id ? "Hide logs" : "Logs"}
                    </button>
                    <button onClick={() => handleTest(ep.id)} disabled={testing === ep.id || !ep.enabled}
                      className="text-xs px-3 py-1.5 rounded-md bg-indigo-950 text-indigo-400 hover:bg-indigo-900 border border-indigo-900 disabled:opacity-40 transition-colors">
                      {testing === ep.id ? "…" : "Test"}
                    </button>
                    <button onClick={() => handleToggle(ep)} disabled={toggling === ep.id}
                      className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 transition-colors">
                      {toggling === ep.id ? "…" : ep.enabled ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => handleDelete(ep.id)} disabled={deleting === ep.id}
                      className="text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 disabled:opacity-40 transition-colors">
                      {deleting === ep.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery log */}
              {deliveries?.id === ep.id && (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden mt-1">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-neutral-800">
                      {["Event","Status","HTTP","Attempts","Duration","Time"].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-neutral-600 font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {deliveries.rows.length === 0 ? (
                        <tr><td colSpan={6} className="px-3 py-4 text-center text-neutral-600">No deliveries yet</td></tr>
                      ) : deliveries.rows.map(d => (
                        <tr key={d.id} className="border-b border-neutral-800/40">
                          <td className="px-3 py-2 font-mono text-neutral-400">{d.event_type}</td>
                          <td className={`px-3 py-2 font-medium capitalize ${STATUS_STYLE[d.status] ?? "text-neutral-400"}`}>{d.status}</td>
                          <td className="px-3 py-2 text-neutral-500 tabular-nums">{d.response_status ?? "—"}</td>
                          <td className="px-3 py-2 text-neutral-500 tabular-nums">{d.attempts}</td>
                          <td className="px-3 py-2 text-neutral-500 tabular-nums">{d.duration_ms != null ? `${d.duration_ms}ms` : "—"}</td>
                          <td className="px-3 py-2 text-neutral-600">{new Date(d.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
