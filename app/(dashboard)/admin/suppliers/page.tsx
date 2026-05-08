"use client";

import { useEffect, useState } from "react";
import { getAdminSuppliers, patchAdminSupplier, type AdminSupplier } from "@/lib/api";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<string | null>(null);
  const [saving,    setSaving]    = useState<string | null>(null);
  const [form,      setForm]      = useState({ trust_score: "", reliability_score: "" });

  useEffect(() => {
    getAdminSuppliers().then(r => setSuppliers(r.suppliers)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function startEdit(s: AdminSupplier) {
    setEditing(s.id);
    setForm({ trust_score: s.trust_score?.toString() ?? "", reliability_score: s.reliability_score?.toString() ?? "" });
  }

  async function saveScores(id: string) {
    setSaving(id);
    try {
      const fields: { trust_score?: number; reliability_score?: number } = {};
      if (form.trust_score)       fields.trust_score       = parseFloat(form.trust_score);
      if (form.reliability_score) fields.reliability_score = parseFloat(form.reliability_score);
      const r = await patchAdminSupplier(id, fields);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...r.supplier } : s));
      setEditing(null);
    } catch { /* ignore */ } finally { setSaving(null); }
  }

  const scoreColor = (v?: number) => !v ? "text-neutral-500" : v >= 8 ? "text-emerald-400" : v >= 5 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Supplier Onboarding</h1>
        <p className="text-sm text-neutral-400 mt-1">{suppliers.length} suppliers · manage trust scores and categories</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Suppliers", value: suppliers.length },
          { label: "With Products",   value: suppliers.filter(s => (s.product_count ?? 0) > 0).length },
          { label: "No Owner",        value: suppliers.filter(s => !s.owner_email).length, warn: true },
        ].map(({ label, value, warn }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${warn && value > 0 ? "text-yellow-400" : "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Supplier", "Owner", "Products", "Trust", "Reliability", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500 text-sm">Loading…</td></tr>
            ) : suppliers.map(s => (
              <>
                <tr key={s.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-neutral-600">{s.categories?.join(", ") || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{s.owner_email || <span className="text-yellow-500">No owner</span>}</td>
                  <td className="px-4 py-3 text-neutral-300 text-sm tabular-nums">{s.product_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold tabular-nums ${scoreColor(s.trust_score)}`}>
                      {s.trust_score?.toFixed(1) ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold tabular-nums ${scoreColor(s.reliability_score)}`}>
                      {s.reliability_score?.toFixed(1) ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { editing === s.id ? setEditing(null) : startEdit(s); }}
                      className="text-xs px-3 py-1 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                      Edit scores
                    </button>
                  </td>
                </tr>
                {editing === s.id && (
                  <tr key={`edit-${s.id}`} className="border-b border-indigo-900/30 bg-neutral-800/30">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Trust Score (0–10)</label>
                          <input type="number" step="0.1" min="0" max="10" value={form.trust_score}
                            onChange={e => setForm(f => ({ ...f, trust_score: e.target.value }))}
                            className="w-24 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Reliability Score (0–10)</label>
                          <input type="number" step="0.1" min="0" max="10" value={form.reliability_score}
                            onChange={e => setForm(f => ({ ...f, reliability_score: e.target.value }))}
                            className="w-24 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => saveScores(s.id)} disabled={saving === s.id}
                            className="text-xs px-4 py-1.5 rounded-md bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 transition-colors">
                            {saving === s.id ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="text-xs px-3 py-1.5 rounded-md bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
