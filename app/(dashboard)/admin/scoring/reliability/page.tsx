"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getScoringConfig, updateScoringConfig, getAdminSuppliers, type ScoringConfig, type AdminSupplier } from "@/lib/api";

export default function ReliabilityModelPage() {
  const [configs,   setConfigs]   = useState<ScoringConfig[]>([]);
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);

  useEffect(() => {
    getScoringConfig().then(r => setConfigs(r.configs.filter(c => c.group_name === "reliability" || c.key === "weight_reliability"))).catch(() => {});
    getAdminSuppliers().then(r => setSuppliers(r.suppliers)).catch(() => {});
  }, []);

  async function handleSave(key: string, value: number) {
    const r = await updateScoringConfig(key, value);
    setConfigs(prev => prev.map(c => c.key === key ? r.config : c));
  }

  // Compute reliability score from supplier data (mirrors backend formula)
  function reliabilityFromSupplier(s: AdminSupplier, wTrust = 0.4, wRel = 0.6) {
    if (!s.trust_score && !s.reliability_score) return 0.5;
    const t = (s.trust_score ?? 5) / 10;
    const r = (s.reliability_score ?? 5) / 10;
    return Math.min(1, wTrust * t + wRel * r);
  }

  const wTrust = configs.find(c => c.key === "reliability_weight_trust")?.value ?? 0.4;
  const wRel   = configs.find(c => c.key === "reliability_weight_rel")?.value   ?? 0.6;

  const suppliersWithScore = suppliers
    .map(s => ({ ...s, computed: reliabilityFromSupplier(s, wTrust, wRel) }))
    .sort((a, b) => b.computed - a.computed);

  const avg = suppliersWithScore.length
    ? (suppliersWithScore.reduce((s, x) => s + x.computed, 0) / suppliersWithScore.length).toFixed(2)
    : "—";

  return (
    <div className="max-w-4xl">
      <Link href="/admin/scoring" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Scoring Models</Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <h1 className="text-2xl font-semibold text-white">Supplier Reliability Score</h1>
      </div>

      <div className="bg-neutral-900 border border-emerald-900 rounded-xl p-5 mb-6">
        <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Algorithm</h2>
        <code className="text-sm text-neutral-300 leading-relaxed block">
          reliability = (<span className="text-emerald-400">trust_score</span> / 10 × w₁) + (<span className="text-emerald-400">reliability_score</span> / 10 × w₂)
        </code>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-neutral-500">
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-emerald-400 font-medium mb-1">trust_score (0–10)</p>
            <p>Admin-assigned score reflecting supplier credibility, product quality, and communication. Set manually in Supplier Onboarding.</p>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-emerald-400 font-medium mb-1">reliability_score (0–10)</p>
            <p>Admin-assigned score reflecting fulfillment history, on-time delivery, and stock accuracy. Set manually in Supplier Onboarding.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Stats */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Current Coverage</h2>
          <div className="space-y-3">
            {[
              { label: "Total suppliers",     value: suppliers.length },
              { label: "With trust score",    value: suppliers.filter(s => s.trust_score).length },
              { label: "With reliability",    value: suppliers.filter(s => s.reliability_score).length },
              { label: "Avg reliability",     value: avg },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-neutral-400">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weights */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Weight Parameters</h2>
          {configs.map(c => (
            <div key={c.key} className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
              <div>
                <p className="text-sm text-white">{c.label}</p>
                <p className="text-xs text-neutral-500">{c.description}</p>
              </div>
              <input type="number" step="0.05" min="0" max="1" defaultValue={c.value}
                onBlur={e => handleSave(c.key, parseFloat(e.target.value))}
                className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
          ))}
          <p className="text-xs text-neutral-600 mt-3">Note: w₁ + w₂ should equal 1.0</p>
        </div>
      </div>

      {/* Supplier reliability table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white">Supplier Reliability Scores</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Live preview with current weights — changes when you update parameters above</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Supplier","Trust","Reliability","Computed Score","Products"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliersWithScore.map(s => (
              <tr key={s.id} className="border-b border-neutral-800/50">
                <td className="px-4 py-3 text-white text-sm font-medium">{s.name}</td>
                <td className="px-4 py-3 text-neutral-300 text-sm tabular-nums">{s.trust_score?.toFixed(1) ?? <span className="text-yellow-500">—</span>}</td>
                <td className="px-4 py-3 text-neutral-300 text-sm tabular-nums">{s.reliability_score?.toFixed(1) ?? <span className="text-yellow-500">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.computed * 100}%` }} />
                    </div>
                    <span className="text-emerald-400 font-semibold text-sm tabular-nums">{s.computed.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-400 text-sm tabular-nums">{s.product_count ?? 0}</td>
              </tr>
            ))}
            {suppliersWithScore.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500 text-sm">No suppliers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
