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
          <div className="w-full bg-purple-500 rounded-t opacity-70" style={{ height: `${Math.max(4, (b.count / max) * 64)}px` }} />
          <span style={{ fontSize: 9 }} className="text-neutral-600">{b.bucket.split("–")[0]}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProfitabilityModelPage() {
  const [configs, setConfigs] = useState<ScoringConfig[]>([]);
  const [buckets, setBuckets] = useState<ScoreBucket[]>([]);
  const [top,     setTop]     = useState<Product[]>([]);
  const [bottom,  setBottom]  = useState<Product[]>([]);

  useEffect(() => {
    getScoringConfig().then(r => setConfigs(r.configs.filter(c => c.group_name === "profitability" || c.key === "weight_profitability"))).catch(() => {});
    getScoringDistributions().then(d => setBuckets(d.profitability ?? [])).catch(() => {});
    getScoringTopProducts("profitability", "desc", 5).then(r => setTop(r.products)).catch(() => {});
    getScoringTopProducts("profitability", "asc",  5).then(r => setBottom(r.products)).catch(() => {});
  }, []);

  async function handleSave(key: string, value: number) {
    const r = await updateScoringConfig(key, value);
    setConfigs(prev => prev.map(c => c.key === key ? r.config : c));
  }

  const tiers = [
    { label: "High  (≥$50)",    factor: "0.90", color: "text-emerald-400" },
    { label: "Mid   (≥$20)",    factor: "0.70", color: "text-yellow-400"  },
    { label: "Low   (≥$10)",    factor: "0.50", color: "text-orange-400"  },
    { label: "Entry (<$10)",    factor: "0.30", color: "text-red-400"     },
  ];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/scoring" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">← Scoring Models</Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-purple-500" />
        <h1 className="text-2xl font-semibold text-white">Profitability Score</h1>
      </div>

      <div className="bg-neutral-900 border border-purple-900 rounded-xl p-5 mb-6">
        <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Algorithm</h2>
        <code className="text-sm text-neutral-300 leading-relaxed block">
          profitability = (<span className="text-purple-400">demand</span> × w₁) + ((1 − <span className="text-purple-400">saturation</span>) × w₂) + (<span className="text-purple-400">price_tier</span> × w₃)
        </code>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-neutral-500">
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-purple-400 font-medium mb-1">demand component</p>
            <p>Products with high demand have larger addressable markets — more volume potential</p>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-purple-400 font-medium mb-1">market position</p>
            <p>Low saturation means less price competition and better margin preservation</p>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3">
            <p className="text-purple-400 font-medium mb-1">price tier</p>
            <p>Higher-priced products generally carry better absolute margins (threshold configurable)</p>
          </div>
        </div>

        {/* Price tier table */}
        <div className="mt-4">
          <p className="text-xs text-neutral-600 mb-2">Price tier factors (thresholds configurable below):</p>
          <div className="flex gap-4">
            {tiers.map(t => (
              <div key={t.label} className="bg-neutral-800 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-neutral-400">{t.label} → </span>
                <span className={t.color}>{t.factor}</span>
              </div>
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
          <div className="max-h-64 overflow-y-auto">
            {configs.map(c => (
              <div key={c.key} className="flex items-center justify-between py-2.5 border-b border-neutral-800 last:border-0">
                <div className="flex-1 pr-3">
                  <p className="text-sm text-white">{c.label}</p>
                  <p className="text-xs text-neutral-600 truncate">{c.description}</p>
                </div>
                <input type="number" step={c.key.includes("tier") ? "1" : "0.05"} min="0"
                  defaultValue={c.value}
                  onBlur={e => handleSave(c.key, parseFloat(e.target.value))}
                  className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-purple-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{ label: "Most Profitable", items: top, color: "text-purple-400" }, { label: "Least Profitable", items: bottom, color: "text-neutral-500" }].map(({ label, items, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800"><h3 className="text-xs font-semibold text-neutral-400">{label}</h3></div>
            <table className="w-full text-xs">
              <tbody>
                {items.map(p => (
                  <tr key={p.id} className="border-b border-neutral-800/40">
                    <td className="px-4 py-2 text-white">{p.product_name}</td>
                    <td className="px-4 py-2 text-neutral-500">${p.price?.toFixed(0) ?? "—"}</td>
                    <td className={`px-4 py-2 font-semibold tabular-nums text-right ${color}`}>{(p as unknown as { profitability_score?: number }).profitability_score?.toFixed(2) ?? "—"}</td>
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
