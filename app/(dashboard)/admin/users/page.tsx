"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, patchAdminUser, deleteAdminUser, type AdminUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

const ROLES = ["merchant", "supplier", "admin"];

function roleBadgeStyle(role: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    admin:    { bg: "rgba(255,75,110,0.08)",  color: "var(--red)",  border: "rgba(255,75,110,0.25)"  },
    supplier: { bg: "rgba(77,159,255,0.08)",  color: "var(--blue)", border: "rgba(77,159,255,0.25)"  },
    merchant: { bg: "var(--surface3)",        color: "var(--text-secondary)", border: "var(--border)" },
  };
  const c = map[role] ?? map.merchant;
  return { fontSize: 8, padding: "2px 7px", borderRadius: 2, background: c.bg, color: c.color, border: `1px solid ${c.border}`, letterSpacing: 0.5, textTransform: "capitalize" };
}

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [saving,   setSaving]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const me = getCurrentUser();

  useEffect(() => {
    getAdminUsers().then(r => setUsers(r.users)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function changeRole(id: string, role: string) {
    setSaving(id);
    try { const r = await patchAdminUser(id, role); setUsers(prev => prev.map(u => u.id === id ? r.user : u)); }
    catch { /* ignore */ } finally { setSaving(null); }
  }

  async function removeUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setDeleting(id);
    try { await deleteAdminUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }
    catch { /* ignore */ } finally { setDeleting(null); }
  }

  const filtered = users.filter(u =>
    !query || u.email.toLowerCase().includes(query.toLowerCase()) || (u.name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ADMIN</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>User Management</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{users.length} total users</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {ROLES.map(role => (
          <div key={role} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5, textTransform: "capitalize" }}>{role}s</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{users.filter(u => u.role === role).length}</p>
          </div>
        ))}
      </div>

      <input type="text" placeholder="Search by email or name…" value={query} onChange={e => setQuery(e.target.value)}
        style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 12px", fontSize: 11, color: "var(--text-primary)", outline: "none", marginBottom: 14, boxSizing: "border-box" }}
      />

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["User","Role","Joined",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "28px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>Loading…</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{u.name || "—"}</p>
                  <p style={{ fontSize: 9, color: "var(--text-secondary)", margin: 0 }}>{u.email}</p>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <select value={u.role} disabled={saving === u.id || u.id === me?.id}
                    onChange={e => changeRole(u.id, e.target.value)}
                    style={{ ...roleBadgeStyle(u.role), cursor: "pointer", outline: "none", paddingRight: 8 }}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-dim)" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: "10px 16px" }}>
                  {u.id !== me?.id && (
                    <button onClick={() => removeUser(u.id, u.email)} disabled={deleting === u.id}
                      style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: "rgba(255,75,110,0.08)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.25)", cursor: "pointer", opacity: deleting === u.id ? 0.5 : 1 }}>
                      {deleting === u.id ? "…" : "Delete"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
