"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getScoringConfig, updateScoringConfig, getScoringDistributions, getScoringTopProducts, type ScoringConfig, type ScoreBucket, type Product } from "@/lib/api";

function DistributionBar({ buckets, color }: { buckets: ScoreBucket[]; color: string }) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {buckets.map(b => (
        <div key={b.bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 8, color: "var(--text-dim)" }}>{b.count || ""}</span>
          <div style={{ width: "100%", background: color, borderRadius: "2px 2px 0 0", opacity: 0.7, height: `${Math.max(4, (b.count / max) * 56)}px` }} />
          <span style={{ fontSize: 8, color: "var(--text-dim)" }}>{b.bucket.split("–")[0]}</span>
        </div>
      ))}
    </div>
  );
}

function ConfigRow({ cfg, onSave }: { cfg: ScoringConfig; onSave: (key: string, v: number) => void }) {
  const [val, setVal] = useState(cfg.value.toString());
  const [saving, setSaving] = useState(false);
  async function save() { setSaving(true); await onSave(cfg.key, parseFloat(val)); setSaving(false); }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <p style={{ fontSize: 11, color: "var(--text-primary)", margin: 0 }}>{cfg.label}</p>
        <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>{cfg.description}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="number" step="0.01" min="0" max="1" value={val} onChange={e => setVal(e.target.value)}
          style={{ width: 72, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--text-primary)", outline: "none", textAlign: "right" }} />
        <button onClick={save} disabled={saving || parseFloat(val) === cfg.value} style={{ fontSize: 9, padding: "4px 10px", borderRadius: 4, background: "rgba(77,159,255,0.1)", color: "var(--blue)", border: "1px solid rgba(77,159,255,0.3)", cursor: "pointer", opacity: saving || parseFloat(val) === cfg.value ? 0.5 : 1 }}>
          {saving ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function DemandModelPage() {
  const [configs, setConfigs] = useState<ScoringConfig[]>([]);
  const [buckets, setBuckets] = useState<ScoreBucket[]>([]);
  const [top,     setTop]     = useState<Product[]>([]);
  const [bottom,  setBottom]  = useState<Product[]>([]);

  useEffect(() => {
    getScoringConfig().then(r => setConfigs(r.configs.filter(c => c.group_name === "demand" || c.key === "weight_demand"))).catch(() => {});
    getScoringDistributions().then(d => setBuckets(d.demand ?? [])).catch(() => {});
    getScoringTopProducts("demand", "desc", 5).then(r => setTop(r.products)).catch(() => {});
    getScoringTopProducts("demand", "asc",  5).then(r => setBottom(r.products)).catch(() => {});
  }, []);

  async function handleSave(key: string, value: number) {
    const r = await updateScoringConfig(key, value);
    setConfigs(prev => prev.map(c => c.key === key ? r.config : c));
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/admin/scoring" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← Scoring Models</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--blue)" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Demand Score</h1>
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid rgba(77,159,255,0.3)", borderRadius: 4, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--blue)", marginBottom: 10 }} className="font-orbitron">ALGORITHM</div>
        <code style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 2, display: "block" }}>
          demand = (<span style={{ color: "var(--blue)" }}>category_factor</span> × w₁) + (<span style={{ color: "var(--blue)" }}>price_accessibility</span> × w₂) + (<span style={{ color: "var(--blue)" }}>stock_pressure</span> × w₃)
        </code>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
          {[
            { name: "category_factor",     desc: "Electronics=0.90, Lifestyle=0.82, Office=0.75, default=0.60" },
            { name: "price_accessibility", desc: "1 − min(price / ceiling, 1.0). Lower price = higher accessibility." },
            { name: "stock_pressure",      desc: "1 − min(stock / ceiling, 1.0). Low stock signals high demand." },
          ].map(({ name, desc }) => (
            <div key={name} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px" }}>
              <p style={{ fontSize: 9, color: "var(--blue)", fontWeight: 600, marginBottom: 4 }}>{name}</p>
              <p style={{ fontSize: 9, color: "var(--text-dim)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">SCORE DISTRIBUTION</div>
          {buckets.length > 0 ? <DistributionBar buckets={buckets} color="var(--blue)" /> : <p style={{ fontSize: 11, color: "var(--text-dim)" }}>No data yet — run scoring</p>}
        </div>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">PARAMETERS</div>
          {configs.map(c => <ConfigRow key={c.key} cfg={c} onSave={handleSave} />)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[{ label: "Highest Demand", items: top, color: "var(--blue)", field: "demand_score" }, { label: "Lowest Demand", items: bottom, color: "var(--text-dim)", field: "demand_score" }].map(({ label, items, color, field }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: 9, letterSpacing: 1, color: "var(--text-dim)" }}>{label}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {items.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 14px", fontSize: 10, color: "var(--text-primary)" }}>{p.product_name}</td>
                    <td style={{ padding: "8px 14px", fontSize: 9, color: "var(--text-dim)" }}>{p.category}</td>
                    <td style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color, textAlign: "right" }}>{(p as unknown as Record<string, number>)[field]?.toFixed(2) ?? "—"}</td>
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
