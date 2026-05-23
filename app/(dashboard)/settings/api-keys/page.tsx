"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiKeys, createApiKey, revokeApiKey, type ApiKey } from "@/lib/api";

const ALL_SCOPES = [
  { value: "read:products",        label: "Read Products"    },
  { value: "write:products",       label: "Write Products"   },
  { value: "read:suppliers",       label: "Read Suppliers"   },
  { value: "read:recommendations", label: "Recommendations"  },
  { value: "read:workflows",       label: "Read Workflows"   },
  { value: "write:workflows",      label: "Write Workflows"  },
  { value: "read:scoring",         label: "Scoring Data"     },
  { value: "read:analytics",       label: "Analytics"        },
];

const inputStyle: React.CSSProperties = {
  background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 4,
  padding: "7px 10px", fontSize: 11, color: "var(--text-primary)", outline: "none",
};

export default function ApiKeysPage() {
  const [keys,     setKeys]     = useState<ApiKey[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name,     setName]     = useState("");
  const [scopes,   setScopes]   = useState<string[]>(["read:products", "read:recommendations"]);
  const [expires,  setExpires]  = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey,   setNewKey]   = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
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
      setShowForm(false); setName(""); setScopes(["read:products"]); setExpires("");
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
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function toggleScope(s: string) {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  const active  = keys.filter(k => !k.revoked);
  const revoked = keys.filter(k =>  k.revoked);

  return (
    <div style={{ maxWidth: 680 }}>
      <Link href="/settings" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← Settings</Link>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ACCOUNT</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>API Keys</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Authenticate programmatic access to the Ravro API</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={showForm} style={{ background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          + Generate key
        </button>
      </div>

      {newKey && (
        <div style={{ background: "rgba(0,245,196,0.06)", border: "1px solid rgba(0,245,196,0.3)", borderRadius: 4, padding: "16px 18px", marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--mint)", marginBottom: 8 }}>⚠ Copy your key now — it will never be shown again</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code style={{ flex: 1, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 10px", fontSize: 10, color: "var(--text-primary)", wordBreak: "break-all", fontFamily: "monospace" }}>{newKey}</code>
            <button onClick={copyKey} style={{ flexShrink: 0, fontSize: 10, padding: "7px 12px", borderRadius: 4, cursor: "pointer", background: copied ? "rgba(0,245,196,0.08)" : "var(--surface3)", color: copied ? "var(--mint)" : "var(--text-secondary)", border: `1px solid ${copied ? "var(--border-mint)" : "var(--border)"}` }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} style={{ fontSize: 10, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>I&apos;ve copied it — dismiss</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "20px 22px", marginBottom: 18 }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 16 }} className="font-orbitron">NEW API KEY</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5 }}>Key name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Production integration" style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 8 }}>Scopes</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {ALL_SCOPES.map(s => (
                <label key={s.value} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10, border: `1px solid ${scopes.includes(s.value) ? "var(--border-mint)" : "var(--border)"}`, background: scopes.includes(s.value) ? "rgba(0,245,196,0.06)" : "var(--surface3)", color: scopes.includes(s.value) ? "var(--mint)" : "var(--text-secondary)" }}>
                  <input type="checkbox" checked={scopes.includes(s.value)} onChange={() => toggleScope(s.value)} style={{ accentColor: "var(--mint)" }} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5 }}>Expires (optional)</label>
            <input type="date" value={expires} onChange={e => setExpires(e.target.value)} style={{ ...inputStyle, width: 160 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={creating || !name.trim()} style={{ background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4, padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: creating || !name.trim() ? 0.5 : 1 }}>
              {creating ? "Generating…" : "Generate key"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Loading…</div>
      ) : active.length === 0 && !showForm ? (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>No active API keys.</p>
          <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>Generate a key to access the Ravro API programmatically.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {active.map(k => (
            <div key={k.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, marginBottom: 4 }}>{k.name}</p>
                  <code style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "monospace" }}>{k.key_prefix}••••••••••••••••</code>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {k.scopes.map(s => (
                      <span key={s} style={{ fontSize: 8, padding: "1px 6px", borderRadius: 2, background: "rgba(0,245,196,0.08)", color: "var(--mint)", border: "1px solid var(--border-mint)" }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 9, color: "var(--text-dim)" }}>
                    <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                    {k.last_used_at && <span>Last used: {new Date(k.last_used_at).toLocaleDateString()}</span>}
                    {k.expires_at && <span style={{ color: "var(--amber)" }}>Expires: {new Date(k.expires_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={() => handleRevoke(k.id)} disabled={revoking === k.id} style={{ flexShrink: 0, marginLeft: 14, fontSize: 10, padding: "5px 10px", borderRadius: 4, background: "rgba(255,75,110,0.08)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.25)", cursor: "pointer", opacity: revoking === k.id ? 0.5 : 1 }}>
                  {revoking === k.id ? "…" : "Revoke"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {revoked.length > 0 && (
        <div>
          <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 8, letterSpacing: 0.3 }}>Revoked keys ({revoked.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {revoked.map(k => (
              <div key={k.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.45 }}>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-dim)", textDecoration: "line-through", margin: 0 }}>{k.name}</p>
                  <code style={{ fontSize: 9, color: "var(--text-dim)", fontFamily: "monospace" }}>{k.key_prefix}••••••••••••••••</code>
                </div>
                <span style={{ fontSize: 9, color: "var(--text-dim)" }}>Revoked</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
