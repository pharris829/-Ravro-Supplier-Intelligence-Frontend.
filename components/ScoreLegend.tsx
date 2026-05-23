"use client";

import { useState } from "react";

const TIERS = [
  { range: "0.91 – 1.00", label: "Exceptional",       color: "#00F5C4", bg: "rgba(0,245,196,0.08)",   border: "rgba(0,245,196,0.25)",   desc: "Rare category. Top 1–3% of products — strong alignment, high demand, minimal competition." },
  { range: "0.76 – 0.90", label: "High Opportunity",  color: "#4D9FFF", bg: "rgba(77,159,255,0.08)",  border: "rgba(77,159,255,0.25)",  desc: "Strong alignment, strong demand, low competition. Act quickly — these move fast." },
  { range: "0.61 – 0.75", label: "Strong",             color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", desc: "Good demand, solid margins, or good supplier match. Reliable performers." },
  { range: "0.41 – 0.60", label: "Average",            color: "#FFB84D", bg: "rgba(255,184,77,0.08)",  border: "rgba(255,184,77,0.25)",  desc: "Decent, but not a standout opportunity. Worth monitoring." },
  { range: "0.21 – 0.40", label: "Weak",               color: "#8890A4", bg: "rgba(136,144,164,0.08)", border: "rgba(136,144,164,0.25)", desc: "Some potential, but major issues exist. Low demand, high saturation, or poor supplier fit." },
  { range: "0.00 – 0.20", label: "Very Poor",          color: "#FF4B6E", bg: "rgba(255,75,110,0.08)",  border: "rgba(255,75,110,0.25)",  desc: "Product is misaligned, low demand, or heavily oversaturated. Avoid unless repositioning." },
];

interface Props {
  /** Highlight a specific score in the legend */
  activeScore?: number | null;
  /** Collapse into a toggle button (default true) */
  collapsible?: boolean;
  /** Start expanded (only used when collapsible=true) */
  defaultOpen?: boolean;
}

function getTier(score: number) {
  if (score >= 0.91) return TIERS[0];
  if (score >= 0.76) return TIERS[1];
  if (score >= 0.61) return TIERS[2];
  if (score >= 0.41) return TIERS[3];
  if (score >= 0.21) return TIERS[4];
  return TIERS[5];
}

export function ScoreLegend({ activeScore, collapsible = true, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {TIERS.map(t => {
        const isActive = activeScore != null && getTier(activeScore) === t;
        return (
          <div key={t.label} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "10px 14px", borderRadius: 4,
            background: isActive ? t.bg : "transparent",
            border: `1px solid ${isActive ? t.border : "var(--border)"}`,
            transition: "all 0.15s",
          }}>
            <div style={{ minWidth: 84, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontFamily: "'Space Grotesk',monospace", color: t.color, fontWeight: 700, letterSpacing: 0.3 }}>
                {t.range}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.label}</span>
                {isActive && (
                  <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 2, background: t.bg, border: `1px solid ${t.border}`, color: t.color, letterSpacing: 0.5 }}>
                    YOUR SCORE
                  </span>
                )}
              </div>
              <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{t.desc}</p>
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 6, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Scores are normalised 0–1 across Match, Demand, Saturation, and Profitability components.
        Updated on every scoring run.
      </p>
    </div>
  );

  if (!collapsible) return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
      <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 12 }} className="font-orbitron">SCORE LEGEND</div>
      {body}
    </div>
  );

  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Space Grotesk',sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 8, letterSpacing: 2, color: "var(--text-dim)" }} className="font-orbitron">SCORE LEGEND</span>
          <span style={{ fontSize: 9, color: "var(--text-dim)" }}>— what do these numbers mean?</span>
        </div>
        <span style={{ fontSize: 10, color: "var(--text-dim)", transition: "transform 0.15s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ paddingTop: 12 }}>{body}</div>
        </div>
      )}
    </div>
  );
}

/** Inline badge for use inside tables / cards */
export function ScoreTierBadge({ score }: { score?: number | null }) {
  if (score == null) return null;
  const t = getTier(score);
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 2, letterSpacing: 0.5,
      color: t.color, background: t.bg, border: `1px solid ${t.border}`,
      fontFamily: "'Space Grotesk',sans-serif",
    }}>
      {t.label.toUpperCase()}
    </span>
  );
}
