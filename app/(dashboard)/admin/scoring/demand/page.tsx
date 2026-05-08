"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getScoringConfig, updateScoringConfig, getScoringDistributions, getScoringTopProducts, type ScoringConfig, type ScoreBucket, type Product } from "@/lib/api";

function DistributionBar({ buckets }: { buckets: ScoreBucket[] }) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {buckets.map(b => (
        <div key={b.bucket} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-neutral-600 tabular-nums">{b.count || ""}</span>
          <div className="w-full bg-blue-500 rounded-t opacity-70" style={{ height: `${Math.max(4, (b.count / max) * 64)}px` }} />
          <span className="text-xs text-neutral-600" style={{ fontSize: 9 }}>{b.bucket.split("–")[0]}</span>
        </div>
      ))}
    </div>
  );
}

function ConfigRow({ cfg, onSave }: { cfg: ScoringConfig; onSave: (key: string, v: number) => void }) {
  const [val, setVal] = useState(cfg.value.toString());
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    await onSave(cfg.key, parseFloat(val));
    setSaving(false);
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
      <div>
        <p className="text-sm text-white">{cfg.label}</p>
        <p className="text-xs text-neutral-500">{cfg.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" step="0.01" min="0" max="1" value={val}
          onChange={e => setVal(e.target.value)}
          className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button onClick={save} disabled={saving || parseFloat(val) === cfg.value}
          className="text-xs px-3 py-1 rounded-md bg-blue-900 text-blue-300 hover:bg-blue-800 disabled:opacity-40 transition-colors">
          {saving ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function DemandModelPage() {
  const [configs, setConfigs]   = useState<ScoringConfig[]>([]);
  const [buckets, setBuckets]   = useState<ScoreBucket[]>([]);
  const [top,     setTop]       = useState<Product[]>([]);
  const [bottom,  setBottom]    = useState<Product[]>([]);

  useEffect(() => {
    getScoringConfig().then(r => setConfigs(r.configs.filter(c => c.group_name === "demand" || c.group_name === "composite" && c.key === "weight_demand"))).catch(() => {});
    getScoringDistributions().then(d => setBuckets(d.demand ?? [])).catch(() => {});
    getScoringTopProducts("demand", "desc", 5).then(r => setTop(r.products)).catch(() => {});
    getScoringTopProducts("demand", "asc",  5).then(r => setBottom(r.products)).catch(() => {});
  }, []);

  async function handleSave(key: string, value: number) {
    const r = await updateScoringConfig(key, value);
    setConfigs(prev => prev.map(c => c.key === key ? r.config : c));
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin/scoring" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Scoring Models</Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <h1 className="text-2xl font-semibold text-white">Demand Score</h1>
      </div>

      {/* Formula */}
      <div className="bg-neutral-900 border border-blue-900 rounded-xl p-5 mb-6">
        <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Algorithm</h2>
        <code className="text-sm text-neutral-300 leading-relaxed block">
          demand = (<span className="text-blue-400">category_factor</span> × w₁) + (<span className="text-blue-400">price_accessibility</span> × w₂) + (<span className="text-blue-400">stock_pressure</span> × w₃)
        </code>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-neutral-500">
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-blue-400 font-medium mb-1">category_factor</p>
            <p>Electronics=0.90, Lifestyle=0.82, Office=0.75, Kitchen=0.70, default=0.60</p>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-blue-400 font-medium mb-1">price_accessibility</p>
            <p>1 − min(price / ceiling, 1.0)<br />Lower price = higher accessibility</p>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-blue-400 font-medium mb-1">stock_pressure</p>
            <p>1 − min(stock / ceiling, 1.0)<br />Low stock signals high demand</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Distribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Score Distribution</h2>
          {buckets.length > 0 ? <DistributionBar buckets={buckets} /> : <p className="text-neutral-500 text-sm">No data yet — run scoring</p>}
        </div>

        {/* Config */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Parameters</h2>
          {configs.map(c => <ConfigRow key={c.key} cfg={c} onSave={handleSave} />)}
        </div>
      </div>

      {/* Top / bottom */}
      <div className="grid grid-cols-2 gap-4">
        {[{ label: "Highest Demand", items: top, color: "text-blue-400" }, { label: "Lowest Demand", items: bottom, color: "text-neutral-500" }].map(({ label, items, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800"><h3 className="text-xs font-semibold text-neutral-400">{label}</h3></div>
            <table className="w-full text-xs">
              <tbody>
                {items.map(p => (
                  <tr key={p.id} className="border-b border-neutral-800/40">
                    <td className="px-4 py-2 text-white">{p.product_name}</td>
                    <td className="px-4 py-2 text-neutral-500">{p.category}</td>
                    <td className={`px-4 py-2 font-semibold tabular-nums text-right ${color}`}>{p.demand_score?.toFixed(2) ?? "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-center text-neutral-600">No data</td></tr>}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
