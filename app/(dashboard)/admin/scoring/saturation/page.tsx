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
          <div className="w-full bg-orange-500 rounded-t opacity-70" style={{ height: `${Math.max(4, (b.count / max) * 64)}px` }} />
          <span style={{ fontSize: 9 }} className="text-neutral-600">{b.bucket.split("–")[0]}</span>
        </div>
      ))}
    </div>
  );
}

export default function SaturationModelPage() {
  const [configs, setConfigs] = useState<ScoringConfig[]>([]);
  const [buckets, setBuckets] = useState<ScoreBucket[]>([]);
  const [high,    setHigh]    = useState<Product[]>([]);
  const [low,     setLow]     = useState<Product[]>([]);

  useEffect(() => {
    getScoringConfig().then(r => setConfigs(r.configs.filter(c => c.group_name === "saturation" || c.key === "weight_saturation"))).catch(() => {});
    getScoringDistributions().then(d => setBuckets(d.saturation ?? [])).catch(() => {});
    getScoringTopProducts("saturation", "desc", 5).then(r => setHigh(r.products)).catch(() => {});
    getScoringTopProducts("saturation", "asc",  5).then(r => setLow(r.products)).catch(() => {});
  }, []);

  async function handleSave(key: string, value: number) {
    const r = await updateScoringConfig(key, value);
    setConfigs(prev => prev.map(c => c.key === key ? r.config : c));
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin/scoring" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Scoring Models</Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-orange-500" />
        <h1 className="text-2xl font-semibold text-white">Saturation Score</h1>
      </div>

      <div className="bg-neutral-900 border border-orange-900 rounded-xl p-5 mb-6">
        <h2 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Algorithm</h2>
        <code className="text-sm text-neutral-300 leading-relaxed block">
          saturation = 1 − 1 / (1 + <span className="text-orange-400">competitors</span> ^ <span className="text-orange-400">curve_exp</span>)
        </code>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-neutral-500">
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-orange-400 font-medium mb-1">competitors</p>
            <p>Count of other ingested products in the same category (window function, computed at scoring time)</p>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-orange-400 font-medium mb-1">curve_exp (default 0.5 = √)</p>
            <p>0.5 = gentle sqrt curve · 1.0 = linear · 2.0 = aggressive — controls how fast saturation rises</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-neutral-600">
          <p className="mb-1">Sample values with curve_exp=0.5:</p>
          <div className="flex gap-4">
            {[[0,"0.00"],[1,"0.50"],[3,"0.63"],[8,"0.74"],[24,"0.83"],[99,"0.91"]].map(([n, s]) => (
              <span key={n}><span className="text-neutral-400">{n} competitors</span> → <span className="text-orange-400">{s}</span></span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Score Distribution</h2>
          {buckets.length > 0 ? <DistributionBar buckets={buckets} /> : <p className="text-neutral-500 text-sm">No data yet — run scoring</p>}
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Parameters</h2>
          {configs.map(c => (
            <div key={c.key} className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
              <div>
                <p className="text-sm text-white">{c.label}</p>
                <p className="text-xs text-neutral-500">{c.description}</p>
              </div>
              <input type="number" step="0.05" min="0.1" max="3" defaultValue={c.value}
                onBlur={e => handleSave(c.key, parseFloat(e.target.value))}
                className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-orange-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{ label: "Most Saturated Markets", items: high, color: "text-orange-400" }, { label: "Least Saturated (Opportunity)", items: low, color: "text-emerald-400" }].map(({ label, items, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800"><h3 className="text-xs font-semibold text-neutral-400">{label}</h3></div>
            <table className="w-full text-xs">
              <tbody>
                {items.map(p => (
                  <tr key={p.id} className="border-b border-neutral-800/40">
                    <td className="px-4 py-2 text-white">{p.product_name}</td>
                    <td className="px-4 py-2 text-neutral-500">{p.category}</td>
                    <td className={`px-4 py-2 font-semibold tabular-nums text-right ${color}`}>{(p as unknown as { saturation_score?: number }).saturation_score?.toFixed(2) ?? "—"}</td>
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
