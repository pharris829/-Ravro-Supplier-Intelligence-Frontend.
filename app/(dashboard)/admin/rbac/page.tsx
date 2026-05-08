"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRbac, grantPermission, revokePermission } from "@/lib/api";

const ROLES     = ["merchant", "supplier"] as const; // admin is immutable
const RESOURCES = ["products","suppliers","workflows","scoring","recommendations","ingest","analytics","integrations","api_keys","users"] as const;
const ACTIONS   = ["read", "write", "delete"] as const;

type Role     = typeof ROLES[number];
type Resource = typeof RESOURCES[number];
type Action   = typeof ACTIONS[number];

type Matrix = Record<Role, Record<Resource, Set<Action>>>;

function emptyMatrix(): Matrix {
  return Object.fromEntries(
    ROLES.map(r => [r, Object.fromEntries(RESOURCES.map(res => [res, new Set<Action>()])) ])
  ) as Matrix;
}

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
      if (has) {
        await revokePermission(role, resource, action);
      } else {
        await grantPermission(role, resource, action);
      }
      setMatrix(prev => {
        const next = { ...prev, [role]: { ...prev[role], [resource]: new Set(prev[role][resource]) } };
        has ? next[role][resource].delete(action) : next[role][resource].add(action);
        return next;
      });
    } catch { /* ignore */ }
    setSaving(null);
  }

  const roleColors = { merchant: "text-blue-400", supplier: "text-emerald-400" };

  return (
    <div className="max-w-5xl">
      <Link href="/admin" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Admin Console</Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Role-Based Access Control</h1>
        <p className="text-sm text-neutral-400 mt-1">Grant or revoke resource permissions per role. Admin permissions are fixed.</p>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-6 text-xs">
        {ROLES.map(r => (
          <div key={r} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${r === "merchant" ? "bg-blue-400" : "bg-emerald-400"}`} />
            <span className="text-neutral-400 capitalize">{r}</span>
          </div>
        ))}
        <span className="text-neutral-600 ml-4">Click cell to toggle · Admin always has full access</span>
      </div>

      {loading ? (
        <div className="text-neutral-500 text-sm">Loading…</div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-neutral-500 font-medium w-32">Resource</th>
                {ROLES.flatMap(role => ACTIONS.map(action => (
                  <th key={`${role}:${action}`} className="px-2 py-3 text-center font-medium w-16">
                    <div className={`capitalize ${roleColors[role]}`}>{role.slice(0,4)}</div>
                    <div className="text-neutral-600 mt-0.5 capitalize">{action}</div>
                  </th>
                )))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((resource, ri) => (
                <tr key={resource} className={`border-b border-neutral-800/50 ${ri % 2 === 0 ? "bg-neutral-900" : "bg-neutral-900/50"}`}>
                  <td className="px-4 py-3 font-medium text-neutral-300 capitalize">{resource}</td>
                  {ROLES.flatMap(role => ACTIONS.map(action => {
                    const key      = `${role}:${resource}:${action}`;
                    const checked  = matrix[role][resource].has(action);
                    const isSaving = saving === key;
                    const color    = role === "merchant" ? "bg-blue-500 border-blue-700" : "bg-emerald-500 border-emerald-700";

                    return (
                      <td key={key} className="px-2 py-3 text-center">
                        <button
                          onClick={() => toggle(role, resource, action)}
                          disabled={!!saving}
                          title={`${checked ? "Revoke" : "Grant"} ${role} ${action} ${resource}`}
                          className={`w-6 h-6 rounded border transition-all disabled:opacity-50 cursor-pointer ${
                            isSaving ? "animate-pulse bg-neutral-700 border-neutral-600" :
                            checked  ? `${color}` :
                            "bg-neutral-800 border-neutral-700 hover:border-neutral-500"
                          }`}
                        >
                          {checked && !isSaving && <span className="text-white text-xs">✓</span>}
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

      {/* Admin note */}
      <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-neutral-400 mb-2">Admin Role (fixed)</p>
        <p className="text-xs text-neutral-600">Admin has full read + write + delete access to all resources. Admin permissions cannot be modified via this interface.</p>
      </div>
    </div>
  );
}
