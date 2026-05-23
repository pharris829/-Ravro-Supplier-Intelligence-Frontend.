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

  function reliabilityFromSupplier(s: AdminSupplier, wTrust = 0.4, wRel = 0.6) {
    if (!s.trust_score && !s.reliability_score) return 0.5;
    return Math.min(1, (wTrust * (s.trust_score ?? 5) / 10) + (wRel * (s.reliability_score ?? 5) / 10));
  }

  const wTrust = configs.find(c => c.key === "reliability_weight_trust")?.value ?? 0.4;
  const wRel   = configs.find(c => c.key === "reliability_weight_rel")?.value   ?? 0.6;
  const suppliersWithScore = suppliers.map(s => ({ ...s, computed: reliabilityFromSupplier(s, wTrust, wRel) })).sort((a, b) => b.computed - a.computed);
  const avg = suppliersWithScore.length ? (suppliersWithScore.reduce((s, x) => s + x.computed, 0) / suppliersWithScore.length).toFixed(2) : "—";

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href="/admin/scoring" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← Scoring Models</Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--mint)" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Supplier Reliability Score</h1>
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--mint)", marginBottom: 10 }} className="font-orbitron">ALGORITHM</div>
        <code style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 2 }}>
          reliability = (<span style={{ color: "var(--mint)" }}>trust_score</span> / 10 × w₁) + (<span style={{ color: "var(--mint)" }}>reliability_score</span> / 10 × w₂)
        </code>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {[
            { name: "trust_score (0–10)",       desc: "Admin-assigned score reflecting supplier credibility, product quality, and communication." },
            { name: "reliability_score (0–10)",  desc: "Admin-assigned score reflecting fulfillment history, on-time delivery, and stock accuracy." },
          ].map(({ name, desc }) => (
            <div key={name} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px" }}>
              <p style={{ fontSize: 9, color: "var(--mint)", fontWeight: 600, marginBottom: 4 }}>{name}</p>
              <p style={{ fontSize: 9, color: "var(--text-dim)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">CURRENT COVERAGE</div>
          {[
            { label: "Total suppliers",  value: suppliers.length },
            { label: "With trust score", value: suppliers.filter(s => s.trust_score).length },
            { label: "With reliability", value: suppliers.filter(s => s.reliability_score).length },
            { label: "Avg reliability",  value: avg },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">WEIGHT PARAMETERS</div>
          {configs.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-primary)", margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>{c.description}</p>
              </div>
              <input type="number" step="0.05" min="0" max="1" defaultValue={c.value}
                onBlur={e => handleSave(c.key, parseFloat(e.target.value))}
                style={{ width: 72, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "var(--text-primary)", outline: "none", textAlign: "right" }} />
            </div>
          ))}
          <p style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 8 }}>Note: w₁ + w₂ should equal 1.0</p>
        </div>
      </div>

      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)" }} className="font-orbitron">SUPPLIER RELIABILITY SCORES</div>
          <p style={{ fontSize: 9, color: "var(--text-dim)", margin: "4px 0 0" }}>Live preview with current weights</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Supplier","Trust","Reliability","Computed Score","Products"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliersWithScore.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</td>
                <td style={{ padding: "10px 16px", fontSize: 11, color: s.trust_score ? "var(--text-primary)" : "var(--amber)" }}>{s.trust_score?.toFixed(1) ?? "—"}</td>
                <td style={{ padding: "10px 16px", fontSize: 11, color: s.reliability_score ? "var(--text-primary)" : "var(--amber)" }}>{s.reliability_score?.toFixed(1) ?? "—"}</td>
                <td style={{ padding: "10px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 3, background: "var(--surface3)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.computed * 100}%`, background: "var(--mint)" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mint)" }}>{s.computed.toFixed(2)}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 16px", fontSize: 11, color: "var(--text-secondary)" }}>{s.product_count ?? 0}</td>
              </tr>
            ))}
            {suppliersWithScore.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>No suppliers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
