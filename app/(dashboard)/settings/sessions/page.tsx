"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessions, revokeSession, type Session } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

function parseUserAgent(ua?: string) {
  if (!ua) return "Unknown client";
  if (ua.includes("Chrome"))  return `Chrome · ${ua.includes("Mac") ? "macOS" : ua.includes("Win") ? "Windows" : "Linux"}`;
  if (ua.includes("Firefox")) return `Firefox · ${ua.includes("Mac") ? "macOS" : "Windows"}`;
  if (ua.includes("Safari"))  return `Safari · ${ua.includes("iPhone") ? "iOS" : "macOS"}`;
  return ua.slice(0, 60);
}

export default function SessionsPage() {
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [loading, setLoading]     = useState(true);
  const [revoking, setRevoking]   = useState<string | null>(null);

  useEffect(() => {
    getSessions().then(r => setSessions(r.sessions)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleRevoke(id: string) {
    setRevoking(id);
    await revokeSession(id);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, revoked: true } : s));
    setRevoking(null);
  }

  async function handleRevokeAll() {
    if (!confirm("Revoke all other sessions? You'll stay logged in here.")) return;
    setRevoking("all");
    await revokeSession("all");
    setSessions(prev => prev.map(s => ({ ...s, revoked: true })));
    setRevoking(null);
  }

  const active  = sessions.filter(s => !s.revoked);
  const revoked = sessions.filter(s =>  s.revoked);

  return (
    <div className="max-w-3xl">
      <Link href="/settings" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Settings</Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Active Sessions</h1>
          <p className="text-sm text-neutral-400 mt-1">{active.length} active session{active.length !== 1 ? "s" : ""}</p>
        </div>
        {active.length > 1 && (
          <button onClick={handleRevokeAll} disabled={revoking === "all"}
            className="text-sm px-4 py-2 rounded-lg bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 disabled:opacity-50 transition-colors">
            {revoking === "all" ? "Revoking…" : "Revoke all others"}
          </button>
        )}
      </div>

      {loading ? <div className="text-neutral-500 text-sm">Loading…</div> : (
        <div className="space-y-3 mb-6">
          {active.map((s, i) => (
            <div key={s.id} className={`bg-neutral-900 border rounded-xl px-5 py-4 ${i === 0 ? "border-indigo-800" : "border-neutral-800"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white">{parseUserAgent(s.user_agent)}</p>
                    {i === 0 && <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded">Current</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-neutral-500">
                    <span>IP: <span className="text-neutral-400">{s.ip_address ?? "—"}</span></span>
                    <span>Last active: <span className="text-neutral-400">{new Date(s.last_active_at).toLocaleString()}</span></span>
                    <span>Signed in: <span className="text-neutral-400">{new Date(s.created_at).toLocaleDateString()}</span></span>
                  </div>
                </div>
                {i > 0 && (
                  <button onClick={() => handleRevoke(s.id)} disabled={revoking === s.id}
                    className="shrink-0 ml-4 text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 disabled:opacity-40 transition-colors">
                    {revoking === s.id ? "…" : "Revoke"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {active.length === 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <p className="text-neutral-400 text-sm">No active sessions found.</p>
            </div>
          )}
        </div>
      )}

      {revoked.length > 0 && (
        <div>
          <p className="text-xs text-neutral-600 mb-2">Revoked sessions ({revoked.length})</p>
          <div className="space-y-2">
            {revoked.slice(0, 5).map(s => (
              <div key={s.id} className="bg-neutral-900/40 border border-neutral-800/40 rounded-xl px-5 py-3 opacity-50">
                <p className="text-xs text-neutral-600">{parseUserAgent(s.user_agent)} · {s.ip_address} · Revoked</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
