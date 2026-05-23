"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, getApiKeys, getSessions } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function SettingsPage() {
  const user = getCurrentUser();
  const [perms,     setPerms]     = useState<{ resource: string; action: string }[]>([]);
  const [keyCount,  setKeyCount]  = useState<number | null>(null);
  const [sessCount, setSessCount] = useState<number | null>(null);

  useEffect(() => {
    getMe().then(r => setPerms(r.permissions)).catch(() => {});
    getApiKeys().then(r => setKeyCount(r.api_keys.filter(k => !k.revoked).length)).catch(() => {});
    getSessions().then(r => setSessCount(r.sessions.filter(s => !s.revoked).length)).catch(() => {});
  }, []);

  const sections = [
    { href: "/settings/api-keys", title: "API Keys",       desc: "Generate keys for programmatic access to the Ravro API.", stat: keyCount != null ? `${keyCount} active key${keyCount !== 1 ? "s" : ""}` : null },
    { href: "/settings/oauth",    title: "OAuth Apps",      desc: "Register OAuth applications that can request access to your account.",     stat: null },
    { href: "/settings/sessions", title: "Active Sessions", desc: "View and revoke your current login sessions.", stat: sessCount != null ? `${sessCount} session${sessCount !== 1 ? "s" : ""}` : null },
  ];

  const grouped = perms.reduce<Record<string, string[]>>((acc, p) => {
    (acc[p.resource] = acc[p.resource] || []).push(p.action);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ACCOUNT</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Account security, API access, and permissions</p>
      </div>

      {/* Profile */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 0 16px rgba(0,245,196,0.05)" }}>
        <div suppressHydrationWarning style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,245,196,0.15)", border: "1px solid var(--border-mint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--mint)", flexShrink: 0 }}>
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div suppressHydrationWarning>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{user?.email}</p>
          <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "3px 0 0", textTransform: "capitalize" }}>{user?.role} account</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
        {sections.map(s => (
          <Link key={s.href} href={s.href} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4,
            padding: "14px 18px", textDecoration: "none", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <div>
              <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, marginBottom: 3 }}>{s.title}</h2>
              <p style={{ fontSize: 10, color: "var(--text-dim)", margin: 0 }}>{s.desc}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
              {s.stat && <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0 }}>{s.stat}</p>}
              <p style={{ fontSize: 10, color: "var(--mint)", margin: "3px 0 0" }}>Manage →</p>
            </div>
          </Link>
        ))}
      </div>

      {perms.length > 0 && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">YOUR PERMISSIONS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {Object.entries(grouped).map(([resource, actions]) => (
              <div key={resource} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface3)", borderRadius: 4, padding: "7px 10px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "capitalize" }}>{resource}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {actions.map(a => (
                    <span key={a} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 2, background: "rgba(0,245,196,0.08)", color: "var(--mint)", border: "1px solid var(--border-mint)", textTransform: "capitalize" }}>{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
