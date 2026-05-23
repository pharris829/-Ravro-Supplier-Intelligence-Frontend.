"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRbac, grantPermission, revokePermission } from "@/lib/api";

const ROLES     = ["merchant", "supplier"] as const;
const RESOURCES = ["products","suppliers","workflows","scoring","recommendations","ingest","analytics","integrations","api_keys","users"] as const;
const ACTIONS   = ["read", "write", "delete"] as const;

type Role     = typeof ROLES[number];
type Resource = typeof RESOURCES[number];
type Action   = typeof ACTIONS[number];
type Matrix   = Record<Role, Record<Resource, Set<Action>>>;

function emptyMatrix(): Matrix {
  return Object.fromEntries(
    ROLES.map(r => [r, Object.fromEntries(RESOURCES.map(res => [res, new Set<Action>()]))])
  ) as Matrix;
}

const roleColor = { merchant: "var(--blue)", supplier: "var(--mint)" };

export default function RbacPage() {
  const [matrix,  setMatrix]  = useState<Matrix>(emptyMatrix());
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string | null>(null);

  useEffect(() => {
    getRbac().then(r => {
      const m = emptyMatrix();
      for (const { role, resource, action } of r.permissions) {
        if (ROLES.includes(role as Role) && RESOURCES.includes(resource as Resource) && ACTIONS.includes(action as Action)) {
          m[role as Role][resource as Resource].add(action as Action);
        }
      }
      setMatrix(m);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function toggle(role: Role, resource: Resource, action: Action) {
    const key = `${role}:${resource}:${action}`;
    setSaving(key);
    const has = matrix[role][resource].has(action);
    try {
      if (has) await revokePermission(role, resource, action);
      else     await grantPermission(role, resource, action);
      setMatrix(prev => {
        const next = { ...prev, [role]: { ...prev[role], [resource]: new Set(prev[role][resource]) } };
        has ? next[role][resource].delete(action) : next[role][resource].add(action);
        return next;
      });
    } catch { /* ignore */ }
    setSaving(null);
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href="/admin" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← Admin Console</Link>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">ADMIN</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Role-Based Access Control</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Grant or revoke resource permissions per role. Admin permissions are fixed.</p>
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 18, fontSize: 10 }}>
        {ROLES.map(r => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: roleColor[r] }} />
            <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{r}</span>
          </div>
        ))}
        <span style={{ color: "var(--text-dim)", marginLeft: 12, fontSize: 9 }}>Click cell to toggle · Admin always has full access</span>
      </div>

      {loading ? (
        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Loading…</div>
      ) : (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600, width: 120 }}>Resource</th>
                {ROLES.flatMap(role => ACTIONS.map(action => (
                  <th key={`${role}:${action}`} style={{ padding: "8px 6px", textAlign: "center", width: 60 }}>
                    <div style={{ fontSize: 8, color: roleColor[role], textTransform: "capitalize" }}>{role.slice(0,4)}</div>
                    <div style={{ fontSize: 8, color: "var(--text-dim)", textTransform: "capitalize" }}>{action}</div>
                  </th>
                )))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((resource, ri) => (
                <tr key={resource} style={{ borderBottom: "1px solid var(--border)", background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "10px 14px", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>{resource}</td>
                  {ROLES.flatMap(role => ACTIONS.map(action => {
                    const key      = `${role}:${resource}:${action}`;
                    const checked  = matrix[role][resource].has(action);
                    const isSaving = saving === key;
                    return (
                      <td key={key} style={{ padding: "8px 6px", textAlign: "center" }}>
                        <button
                          onClick={() => toggle(role, resource, action)}
                          disabled={!!saving}
                          title={`${checked ? "Revoke" : "Grant"} ${role} ${action} ${resource}`}
                          style={{
                            width: 24, height: 24, borderRadius: 4, cursor: "pointer",
                            border: `1px solid ${checked ? roleColor[role] + "60" : "var(--border)"}`,
                            background: isSaving ? "var(--surface3)" : checked ? `${roleColor[role]}18` : "transparent",
                            color: checked ? roleColor[role] : "transparent",
                            fontSize: 11, fontWeight: 700,
                            opacity: saving && !isSaving ? 0.5 : 1,
                            transition: "all 0.15s",
                          }}
                        >
                          {checked && !isSaving ? "✓" : isSaving ? "…" : ""}
                        </button>
                      </td>
                    );
                  }))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 14, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, letterSpacing: 0.5 }}>Admin Role (fixed)</p>
        <p style={{ fontSize: 10, color: "var(--text-dim)" }}>Admin has full read + write + delete access to all resources. Admin permissions cannot be modified via this interface.</p>
      </div>
    </div>
  );
}
