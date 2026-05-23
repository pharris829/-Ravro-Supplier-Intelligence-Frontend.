"use client";

import Link from "next/link";
import { MapRegionDetail, MapSupplier } from "@/lib/api";

interface Props {
  countryName: string;
  detail: MapRegionDetail | null;
  loading: boolean;
  role: "merchant" | "supplier" | "admin";
  onClose: () => void;
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round((value ?? 0) * 10);
  const color =
    pct >= 75 ? "var(--mint)" : pct >= 45 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 9, color, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 3, background: "var(--surface3)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function SupplierRow({ s, role }: { s: MapSupplier; role: Props["role"] }) {
  return (
    <Link
      href={`/suppliers/${s.id}`}
      style={{
        display: "block", padding: "10px 12px", borderRadius: 4,
        background: "var(--surface3)", marginBottom: 6,
        border: "1px solid var(--border)", textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>{s.name}</span>
        <span style={{
          fontSize: 8, padding: "1px 5px", borderRadius: 2,
          background: "rgba(0,245,196,0.1)", color: "var(--mint)", letterSpacing: 0.5,
        }}>
          TRUST {Math.round((s.trust_score ?? 0) * 10)}%
        </span>
      </div>

      {s.categories?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 5 }}>
          {s.categories.slice(0, 3).map(c => (
            <span key={c} style={{
              fontSize: 7, padding: "1px 4px", borderRadius: 2,
              background: "var(--surface)", color: "var(--text-secondary)", letterSpacing: 0.3,
            }}>{c}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <span style={{ fontSize: 9, color: "var(--text-dim)" }}>
          {s.product_count} product{s.product_count !== 1 ? "s" : ""}
        </span>
        {role === "merchant" && s.avg_match_score > 0 && (
          <span style={{ fontSize: 9, color: "var(--mint)" }}>
            {Math.round(s.avg_match_score * 100)}% match
          </span>
        )}
        {role === "merchant" && s.avg_demand_score > 0 && (
          <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>
            {Math.round(s.avg_demand_score * 100)}% demand
          </span>
        )}
      </div>
    </Link>
  );
}

export default function RegionPanel({ countryName, detail, loading, role, onClose }: Props) {
  const summary = detail?.summary;

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0,
      width: 320, background: "var(--surface)",
      borderLeft: "1px solid var(--border-mint)",
      display: "flex", flexDirection: "column",
      zIndex: 10, boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 2 }} className="font-orbitron">
            REGION
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{countryName}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 3,
            color: "var(--text-secondary)", fontSize: 12, cursor: "pointer",
            width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: 1 }}>LOADING...</div>
        </div>
      ) : detail ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
          {/* Summary stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 8, marginBottom: 16,
          }}>
            {[
              { label: "Suppliers", value: summary?.supplier_count ?? 0, unit: "" },
              { label: "Products", value: summary?.product_count ?? 0, unit: "" },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{
                background: "var(--surface2)", borderRadius: 4, padding: "10px",
                border: "1px solid var(--border)", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--mint)", lineHeight: 1 }}>
                  {value}{unit}
                </div>
                <div style={{ fontSize: 8, color: "var(--text-dim)", letterSpacing: 0.5, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Score bars */}
          <div style={{
            background: "var(--surface2)", borderRadius: 4, padding: "12px",
            border: "1px solid var(--border)", marginBottom: 16,
          }}>
            <div style={{ fontSize: 8, letterSpacing: 1.5, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">
              REGION SCORES
            </div>
            <ScoreBar value={(summary?.avg_trust_score ?? 0) / 10} label="Avg Trust Score" />
            <ScoreBar value={(summary?.avg_reliability_score ?? 0) / 10} label="Avg Reliability" />
          </div>

          {/* Supplier list */}
          {detail.suppliers.length > 0 && (
            <div>
              <div style={{ fontSize: 8, letterSpacing: 1.5, color: "var(--text-dim)", marginBottom: 10 }} className="font-orbitron">
                {role === "merchant" ? "SUPPLIERS IN REGION" : "OTHER SUPPLIERS"}
              </div>
              {detail.suppliers.map(s => (
                <SupplierRow key={s.id} s={s} role={role} />
              ))}
            </div>
          )}

          {detail.suppliers.length === 0 && (
            <div style={{
              textAlign: "center", padding: "24px 0",
              fontSize: 10, color: "var(--text-dim)",
            }}>
              No suppliers registered in this region yet.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
