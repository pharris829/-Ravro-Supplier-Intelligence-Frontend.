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
          <div style={{ width: "100%", background: "#a855f7", borderRadius: "2px 2px 0 0", opacity: 0.7, height: `${Math.max(4, (b.count / max) * 56)}px` }} />
          <span style={{ fontSize: 8, color: "var(--text-dim)" }}>{b.bucket.split("–")[0]}</span>
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

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/admin/scoring" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← Scoring Models</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#a855f7" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Profitability Score</h1>
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 4, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ fontSize: 7, letterSpacing: 2, color: "#a855f7", marginBottom: 10 }} className="font-orbitron">ALGORITHM</div>
        <code style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 2 }}>
          profitability = (<span style={{ color: "#a855f7" }}>demand</span> × w₁) + ((1 − <span style={{ color: "#a855f7" }}>saturation</span>) × w₂) + (<span style={{ color: "#a855f7" }}>price_tier</span> × w₃)
        </code>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
          {[
            { name: "demand component",  desc: "Products with high demand have larger addressable markets." },
            { name: "market position",   desc: "Low saturation = less competition and better margin preservation." },
            { name: "price tier",        desc: "Higher-priced products generally carry better absolute margins." },
          ].map(({ name, desc }) => (
            <div key={name} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px" }}>
              <p style={{ fontSize: 9, color: "#a855f7", fontWeight: 600, marginBottom: 4 }}>{name}</p>
              <p style={{ fontSize: 9, color: "var(--text-dim)" }}>{desc}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {[{ label: "High (≥$50)", v: "0.90", c: "var(--mint)" }, { label: "Mid (≥$20)", v: "0.70", c: "var(--amber)" }, { label: "Low (≥$10)", v: "0.50", c: "var(--text-secondary)" }, { label: "Entry (<$10)", v: "0.30", c: "var(--red)" }].map(({ label, v, c }) => (
            <div key={label} style={{ background: "var(--surface3)", borderRadius: 4, padding: "5px 10px", fontSize: 9 }}>
              <span style={{ color: "var(--text-secondary)" }}>{label} → </span><span style={{ color: c, fontWeight: 600 }}>{v}</span>
            </div>
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
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {configs.map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1, paddingRight: 10 }}>
                  <p style={{ fontSize: 11, color: "var(--text-primary)", margin: 0 }}>{c.label}</p>
                  <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</p>
                </div>
                <input type="number" step={c.key.includes("tier") ? "1" : "0.05"} min="0"
                  defaultValue={c.value} onBlur={e => handleSave(c.key, parseFloat(e.target.value))}
                  style={{ width: 72, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--text-primary)", outline: "none", textAlign: "right" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[{ label: "Most Profitable", items: top, color: "#a855f7" }, { label: "Least Profitable", items: bottom, color: "var(--text-dim)" }].map(({ label, items, color }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: 9, letterSpacing: 1, color: "var(--text-dim)" }}>{label}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {items.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 14px", fontSize: 10, color: "var(--text-primary)" }}>{p.product_name}</td>
                    <td style={{ padding: "8px 14px", fontSize: 9, color: "var(--text-dim)" }}>${p.price?.toFixed(0) ?? "—"}</td>
                    <td style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color, textAlign: "right" }}>{(p as unknown as { profitability_score?: number }).profitability_score?.toFixed(2) ?? "—"}</td>
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
