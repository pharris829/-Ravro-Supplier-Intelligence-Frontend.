"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getScoringConfig, updateScoringConfig, getScoringDistributions, getScoringTopProducts, type ScoringConfig, type ScoreBucket, type Product } from "@/lib/api";

function DistributionBar({ buckets }: { buckets: ScoreBucket[] }) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {buckets.map(b => (
        <div key={b.bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 8, color: "var(--text-dim)" }}>{b.count || ""}</span>
          <div style={{ width: "100%", background: "var(--amber)", borderRadius: "2px 2px 0 0", opacity: 0.7, height: `${Math.max(4, (b.count / max) * 56)}px` }} />
          <span style={{ fontSize: 8, color: "var(--text-dim)" }}>{b.bucket.split("–")[0]}</span>
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
    <div style={{ maxWidth: 800 }}>
      <Link href="/admin/scoring" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← Scoring Models</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--amber)" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Saturation Score</h1>
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid rgba(255,184,77,0.3)", borderRadius: 4, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--amber)", marginBottom: 10 }} className="font-orbitron">ALGORITHM</div>
        <code style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 2 }}>
          saturation = 1 − 1 / (1 + <span style={{ color: "var(--amber)" }}>competitors</span> ^ <span style={{ color: "var(--amber)" }}>curve_exp</span>)
        </code>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {[
            { name: "competitors",           desc: "Count of other ingested products in the same category, computed at scoring time." },
            { name: "curve_exp (default 0.5 = √)", desc: "0.5 = gentle sqrt · 1.0 = linear · 2.0 = aggressive. Controls how fast saturation rises." },
          ].map(({ name, desc }) => (
            <div key={name} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px" }}>
              <p style={{ fontSize: 9, color: "var(--amber)", fontWeight: 600, marginBottom: 4 }}>{name}</p>
              <p style={{ fontSize: 9, color: "var(--text-dim)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 9, color: "var(--text-dim)" }}>
          Sample values (curve_exp=0.5):{" "}
          {[[0,"0.00"],[1,"0.50"],[3,"0.63"],[8,"0.74"],[24,"0.83"],[99,"0.91"]].map(([n, s]) => (
            <span key={n} style={{ marginRight: 12 }}><span style={{ color: "var(--text-secondary)" }}>{n} comps</span> → <span style={{ color: "var(--amber)" }}>{s}</span></span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">SCORE DISTRIBUTION</div>
          {buckets.length > 0 ? <DistributionBar buckets={buckets} /> : <p style={{ fontSize: 11, color: "var(--text-dim)" }}>No data yet — run scoring</p>}
        </div>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">PARAMETERS</div>
          {configs.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-primary)", margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>{c.description}</p>
              </div>
              <input type="number" step="0.05" min="0.1" max="3" defaultValue={c.value}
                onBlur={e => handleSave(c.key, parseFloat(e.target.value))}
                style={{ width: 72, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--text-primary)", outline: "none", textAlign: "right" }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[{ label: "Most Saturated Markets", items: high, color: "var(--amber)" }, { label: "Least Saturated (Opportunity)", items: low, color: "var(--mint)" }].map(({ label, items, color }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: 9, letterSpacing: 1, color: "var(--text-dim)" }}>{label}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {items.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 14px", fontSize: 10, color: "var(--text-primary)" }}>{p.product_name}</td>
                    <td style={{ padding: "8px 14px", fontSize: 9, color: "var(--text-dim)" }}>{p.category}</td>
                    <td style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color, textAlign: "right" }}>{(p as unknown as { saturation_score?: number }).saturation_score?.toFixed(2) ?? "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", fontSize: 10, color: "var(--text-dim)" }}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
