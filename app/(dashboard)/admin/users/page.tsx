"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, patchAdminUser, deleteAdminUser, type AdminUser } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

const ROLES = ["merchant", "supplier", "admin"];
const ROLE_STYLES: Record<string, string> = {
  admin:    "bg-red-950 text-red-400 border-red-900",
  supplier: "bg-indigo-950 text-indigo-400 border-indigo-900",
  merchant: "bg-neutral-800 text-neutral-400 border-neutral-700",
};

export default function AdminUsersPage() {
  const [users,    setUsers]   = useState<AdminUser[]>([]);
  const [loading,  setLoading] = useState(true);
  const [query,    setQuery]   = useState("");
  const [saving,   setSaving]  = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const me = getCurrentUser();

  useEffect(() => {
    getAdminUsers().then(r => setUsers(r.users)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function changeRole(id: string, role: string) {
    setSaving(id);
    try {
      const r = await patchAdminUser(id, role);
      setUsers(prev => prev.map(u => u.id === id ? r.user : u));
    } catch { /* ignore */ } finally { setSaving(null); }
  }

  async function removeUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { /* ignore */ } finally { setDeleting(null); }
  }

  const filtered = users.filter(u =>
    !query || u.email.toLowerCase().includes(query.toLowerCase()) || (u.name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">User Management</h1>
          <p className="text-sm text-neutral-400 mt-1">{users.length} total users</p>
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {ROLES.map(role => (
          <div key={role} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1 capitalize">{role}s</p>
            <p className="text-2xl font-semibold text-white">{users.filter(u => u.role === role).length}</p>
          </div>
        ))}
      </div>

      <input type="text" placeholder="Search by email or name…" value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 mb-5" />

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["User", "Role", "Joined", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500 text-sm">Loading…</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm text-white font-medium">{u.name || "—"}</p>
                  <p className="text-xs text-neutral-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={saving === u.id || u.id === me?.id}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded border bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:opacity-50 ${ROLE_STYLES[u.role] ?? "text-neutral-400"}`}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {u.id !== me?.id && (
                    <button onClick={() => removeUser(u.id, u.email)} disabled={deleting === u.id}
                      className="text-xs px-3 py-1 rounded-md bg-red-950 text-red-400 hover:bg-red-900 disabled:opacity-40 transition-colors">
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
