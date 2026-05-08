"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiKeys, createApiKey, revokeApiKey, type ApiKey } from "@/lib/api";

const ALL_SCOPES = [
  { value: "read:products",        label: "Read Products"         },
  { value: "write:products",       label: "Write Products"        },
  { value: "read:suppliers",       label: "Read Suppliers"        },
  { value: "read:recommendations", label: "Recommendations"       },
  { value: "read:workflows",       label: "Read Workflows"        },
  { value: "write:workflows",      label: "Write Workflows"       },
  { value: "read:scoring",         label: "Scoring Data"          },
  { value: "read:analytics",       label: "Analytics"             },
];

export default function ApiKeysPage() {
  const [keys, setKeys]         = useState<ApiKey[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState("");
  const [scopes, setScopes]     = useState<string[]>(["read:products", "read:recommendations"]);
  const [expires, setExpires]   = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey]     = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    getApiKeys().then(r => setKeys(r.api_keys)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const r = await createApiKey({ name, scopes, ...(expires ? { expires_at: new Date(expires).toISOString() } : {}) });
      setNewKey(r.api_key.raw_key);
      setKeys(prev => [{ ...r.api_key, revoked: false }, ...prev]);
      setShowForm(false);
      setName(""); setScopes(["read:products"]); setExpires("");
    } finally { setCreating(false); }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;
    setRevoking(id);
    await revokeApiKey(id);
    setKeys(prev => prev.map(k => k.id === id ? { ...k, revoked: true } : k));
    setRevoking(null);
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleScope(s: string) {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  const active  = keys.filter(k => !k.revoked);
  const revoked = keys.filter(k => k.revoked);

  return (
    <div className="max-w-3xl">
      <Link href="/settings" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Settings</Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">API Keys</h1>
          <p className="text-sm text-neutral-400 mt-1">Authenticate programmatic access to the Ravro API</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={showForm}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Generate key
        </button>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-emerald-400 mb-2">⚠ Copy your key now — it will never be shown again</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono break-all">
              {newKey}
            </code>
            <button onClick={copyKey}
              className={`shrink-0 text-sm px-3 py-2 rounded-lg border transition-colors ${copied ? "bg-emerald-900 text-emerald-400 border-emerald-700" : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"}`}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs text-neutral-500 mt-2 hover:text-neutral-300">
            I've copied it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-neutral-900 border border-indigo-800 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">New API Key</h2>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Key name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Production integration"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Scopes</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SCOPES.map(s => (
                <label key={s.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-colors ${scopes.includes(s.value) ? "border-indigo-600 bg-indigo-950/30 text-white" : "border-neutral-700 text-neutral-500 hover:border-neutral-600"}`}>
                  <input type="checkbox" checked={scopes.includes(s.value)} onChange={() => toggleScope(s.value)} className="accent-indigo-500" />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Expires (optional)</label>
            <input type="date" value={expires} onChange={e => setExpires(e.target.value)}
              className="w-48 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={creating || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              {creating ? "Generating…" : "Generate key"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-neutral-400 hover:text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active keys */}
      {loading ? (
        <div className="text-neutral-500 text-sm">Loading…</div>
      ) : active.length === 0 && !showForm ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center mb-4">
          <p className="text-neutral-400 text-sm">No active API keys.</p>
          <p className="text-neutral-600 text-xs mt-1">Generate a key to access the Ravro API programmatically.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {active.map(k => (
            <div key={k.id} className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white mb-1">{k.name}</p>
                  <code className="text-xs text-neutral-500">{k.key_prefix}••••••••••••••••</code>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {k.scopes.map(s => (
                      <span key={s} className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-neutral-600">
                    <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                    {k.last_used_at && <span>Last used: {new Date(k.last_used_at).toLocaleDateString()}</span>}
                    {k.expires_at && <span className="text-yellow-600">Expires: {new Date(k.expires_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={() => handleRevoke(k.id)} disabled={revoking === k.id}
                  className="shrink-0 ml-4 text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 disabled:opacity-40 transition-colors">
                  {revoking === k.id ? "…" : "Revoke"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revoked keys */}
      {revoked.length > 0 && (
        <div>
          <p className="text-xs text-neutral-600 mb-2">Revoked keys ({revoked.length})</p>
          <div className="space-y-2">
            {revoked.map(k => (
              <div key={k.id} className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl px-5 py-3 flex items-center justify-between opacity-50">
                <div>
                  <p className="text-sm text-neutral-500 line-through">{k.name}</p>
                  <code className="text-xs text-neutral-600">{k.key_prefix}••••••••••••••••</code>
                </div>
                <span className="text-xs text-neutral-600">Revoked</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
