"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOAuthApps, createOAuthApp, deleteOAuthApp, type OAuthApp } from "@/lib/api";

const COMMON_SCOPES = ["read:products","read:suppliers","read:recommendations","read:workflows","write:workflows","read:scoring","read:analytics"];

export default function OAuthPage() {
  const [apps, setApps]         = useState<OAuthApp[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [uris, setUris]         = useState("");
  const [scopes, setScopes]     = useState<string[]>(["read:products"]);
  const [creating, setCreating] = useState(false);
  const [newCreds, setNewCreds] = useState<{ client_id: string; client_secret: string } | null>(null);
  const [copied, setCopied]     = useState<"id" | "secret" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    getOAuthApps().then(r => setApps(r.apps)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const redirect_uris = uris.split("\n").map(u => u.trim()).filter(Boolean);
    if (!name.trim() || redirect_uris.length === 0) return;
    setCreating(true);
    try {
      const r = await createOAuthApp({ name, description: desc || undefined, redirect_uris, scopes });
      setNewCreds({ client_id: r.app.client_id, client_secret: r.app.client_secret });
      setApps(prev => [r.app, ...prev]);
      setShowForm(false); setName(""); setDesc(""); setUris(""); setScopes(["read:products"]);
    } finally { setCreating(false); }
  }

  async function handleDelete(id: string, appName: string) {
    if (!confirm(`Delete OAuth app "${appName}"? All integrations using it will break.`)) return;
    setDeleting(id);
    await deleteOAuthApp(id);
    setApps(prev => prev.filter(a => a.id !== id));
    setDeleting(null);
  }

  function copy(text: string, type: "id" | "secret") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleScope(s: string) {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  return (
    <div className="max-w-3xl">
      <Link href="/settings" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Settings</Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">OAuth Applications</h1>
          <p className="text-sm text-neutral-400 mt-1">Register apps that can request delegated access to your account</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={showForm}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Register app
        </button>
      </div>

      {/* Credentials reveal */}
      {newCreds && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-emerald-400 mb-3">⚠ Save your credentials — the client secret won't be shown again</p>
          {[
            { label: "Client ID",     value: newCreds.client_id,     type: "id" as const },
            { label: "Client Secret", value: newCreds.client_secret, type: "secret" as const },
          ].map(({ label, value, type }) => (
            <div key={type} className="mb-3">
              <p className="text-xs text-neutral-400 mb-1">{label}</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-xs text-white font-mono break-all">{value}</code>
                <button onClick={() => copy(value, type)}
                  className={`shrink-0 text-xs px-2 py-1.5 rounded border transition-colors ${copied === type ? "bg-emerald-900 text-emerald-400 border-emerald-700" : "bg-neutral-800 text-neutral-300 border-neutral-700"}`}>
                  {copied === type ? "✓" : "Copy"}
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => setNewCreds(null)} className="text-xs text-neutral-500 hover:text-neutral-300">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-neutral-900 border border-indigo-800 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Register OAuth Application</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">App Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="My Integration"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Description</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this app do?"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Redirect URIs * (one per line)</label>
            <textarea rows={2} value={uris} onChange={e => setUris(e.target.value)} required placeholder="https://myapp.com/callback"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Requested Scopes</label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_SCOPES.map(s => (
                <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-colors ${scopes.includes(s) ? "border-indigo-600 bg-indigo-950/30 text-white" : "border-neutral-700 text-neutral-500"}`}>
                  <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)} className="accent-indigo-500" />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={creating || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              {creating ? "Registering…" : "Register"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-neutral-400 hover:text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* App list */}
      {loading ? <div className="text-neutral-500 text-sm">Loading…</div> :
       apps.length === 0 && !showForm ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
          <p className="text-neutral-400 text-sm">No OAuth apps registered.</p>
          <p className="text-neutral-600 text-xs mt-1">Register an app to enable OAuth-based integrations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => (
            <div key={app.id} className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{app.name}</p>
                  {app.description && <p className="text-xs text-neutral-500 mt-0.5">{app.description}</p>}
                </div>
                <button onClick={() => handleDelete(app.id, app.name)} disabled={deleting === app.id}
                  className="shrink-0 ml-4 text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 disabled:opacity-40 transition-colors">
                  {deleting === app.id ? "…" : "Delete"}
                </button>
              </div>
              <div className="text-xs text-neutral-600 font-mono mb-2">client_id: {app.client_id}</div>
              <div className="flex gap-1 flex-wrap mb-2">
                {app.scopes.map(s => <span key={s} className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded">{s}</span>)}
              </div>
              <p className="text-xs text-neutral-600">Redirects: {app.redirect_uris.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
