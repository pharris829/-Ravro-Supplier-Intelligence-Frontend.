"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  { icon: "◈", name: "Real-Time Stream Processing",  desc: "Ingest millions of supplier events per second with sub-12ms P99 latency. Zero message loss." },
  { icon: "◉", name: "Predictive Intelligence",      desc: "ML-powered opportunity scoring surfaces high-margin products before competitors find them." },
  { icon: "⬡", name: "Command Analytics",             desc: "Unified dashboard across suppliers, products, demand signals, and market saturation." },
  { icon: "◈", name: "Zero-Trust Security",           desc: "HMAC-signed webhooks, API key scoping, RBAC, and full audit trail on every action." },
  { icon: "◉", name: "Edge Deployment",               desc: "Deploy scoring pipelines anywhere. Docker-native, cloud-agnostic, horizontal scale." },
  { icon: "⬡", name: "API-First Integration",         desc: "Versioned public API, official TypeScript SDK, 300+ integration partners." },
];

const METRICS = [
  { num: "4.2M",   sub: "Events per second"  },
  { num: "<12ms",  sub: "P99 Latency"         },
  { num: "99.97%", sub: "SLA Uptime"          },
  { num: "300+",   sub: "Integrations"        },
];

const NAV_LINKS = ["Platform", "Intelligence", "API", "Pricing", "Docs"];

const CHART_BARS = [22, 38, 31, 55, 47, 72, 61, 100, 83, 95];

export default function LandingPage() {
  const router = useRouter();
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const dest = user.role === "merchant" ? "/merchant" : user.role === "supplier" ? "/supplier" : "/admin";
      router.replace(dest);
    }
  }, [router]);

  // Build mini bar chart
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";
    CHART_BARS.forEach((h, i) => {
      const bar = document.createElement("div");
      const isLast = i === CHART_BARS.length - 1;
      const isHigh = h > 70;
      bar.style.cssText = `flex:1;border-radius:1px 1px 0 0;height:${h}%;background:${isLast ? "#00F5C4" : isHigh ? "rgba(0,245,196,0.35)" : "rgba(184,188,200,0.18)"};border-top:1px solid ${isLast ? "#00F5C4" : "transparent"}`;
      chartRef.current!.appendChild(bar);
    });
  }, []);

  return (
    <div className="grid-bg" style={{ background: "var(--obsidian)", minHeight: "100vh", position: "relative" }}>

      {/* ─── NAV ─── */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 40px", borderBottom: "1px solid var(--border)",
        background: "rgba(8,10,15,0.9)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="font-orbitron" style={{ fontWeight: 700, fontSize: 16, letterSpacing: 4, color: "var(--silver-bright)" }}>
            RAVRO
          </span>
        </div>

        <ul style={{ display: "flex", gap: 28, listStyle: "none" }}>
          {NAV_LINKS.map(l => (
            <li key={l}>
              <a href="#" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--mint)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/suppliers/portal" style={{
            fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, letterSpacing: 2,
            textTransform: "uppercase", fontWeight: 600, color: "var(--mint)",
            background: "rgba(0,245,196,0.08)", border: "1px solid var(--border-mint)", padding: "7px 18px",
            borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Supplier Portal
          </Link>
          <Link href="/login" style={{
            fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, letterSpacing: 2,
            textTransform: "uppercase", fontWeight: 600, color: "var(--silver)",
            background: "none", border: "1px solid var(--border)", padding: "7px 18px",
            borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Sign In
          </Link>
          <Link href="/login" style={{
            fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, letterSpacing: 2,
            textTransform: "uppercase", fontWeight: 600, color: "var(--obsidian)",
            background: "var(--mint)", border: "none", padding: "8px 20px",
            borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Get Access
          </Link>
        </div>
      </nav>

      {/* ─── STATUS BAR ─── */}
      <div style={{
        position: "relative", zIndex: 5,
        background: "rgba(0,245,196,0.05)", borderBottom: "1px solid var(--border-mint)",
        padding: "7px 40px", display: "flex", alignItems: "center", gap: 8,
        fontSize: 10, letterSpacing: 1.5, color: "var(--mint-dim)", textTransform: "uppercase", fontWeight: 500,
      }}>
        <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--mint)", display: "inline-block" }} />
        All Systems Operational · Intelligence Engine Active · 4.2M events/sec
      </div>

      {/* ─── HERO ─── */}
      <section style={{
        position: "relative", zIndex: 2,
        padding: "72px 40px 56px", display: "grid",
        gridTemplateColumns: "1fr 360px", gap: 56, alignItems: "center",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div>
          <div className="font-orbitron" style={{
            fontSize: 9, letterSpacing: 4, color: "var(--mint)", textTransform: "uppercase",
            marginBottom: 18, display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ width: 28, height: 1, background: "var(--mint)", display: "inline-block" }} />
            Product Intelligence Platform
          </div>

          <h1 className="font-orbitron" style={{
            fontSize: 40, fontWeight: 900, lineHeight: 1.15, letterSpacing: -1,
            color: "var(--silver-bright)", marginBottom: 20,
          }}>
            Command Your<br />Data With<br />
            <span style={{ color: "var(--mint)" }}>Precision.</span>
          </h1>

          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)", maxWidth: 460, marginBottom: 32 }}>
            RAVRO delivers real-time supplier intelligence at the edge of what's possible.
            Enterprise scoring, machine-speed decisions, zero compromise on clarity.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/login" className="font-grotesk" style={{
              fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
              color: "var(--obsidian)", background: "var(--mint)", border: "none",
              padding: "13px 30px", borderRadius: 2, textDecoration: "none", display: "inline-block",
            }}>
              Initialize System
            </Link>
            <Link href="/suppliers/portal" className="font-grotesk" style={{
              fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
              color: "var(--mint)", background: "rgba(0,245,196,0.08)",
              border: "1px solid var(--border-mint)",
              padding: "13px 30px", borderRadius: 2, textDecoration: "none", display: "inline-block",
            }}>
              List Your Products →
            </Link>
          </div>
        </div>

        {/* Mini dashboard card */}
        <div className="card-mint-edge" style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 4, overflow: "hidden", position: "relative",
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: 3, color: "var(--text-dim)", textTransform: "uppercase" }}>
              Intelligence Feed
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {["#FF5F57","#FFBD2E","#00F5C4"].map(c => (
                <div key={c} style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
              ))}
            </div>
          </div>

          <div style={{ padding: 18 }}>
            {/* Mini metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
              {[["94.2", "Match Score"], ["3.7K", "Products"], ["12ms", "Latency"]].map(([val, lbl]) => (
                <div key={lbl} style={{
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 3, padding: 10, textAlign: "center",
                }}>
                  <span className="font-orbitron" style={{ fontSize: 15, fontWeight: 700, color: "var(--mint)", display: "block", marginBottom: 1 }}>{val}</span>
                  <span style={{ fontSize: 8, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase" }}>{lbl}</span>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div ref={chartRef} style={{
              height: 70, display: "flex", alignItems: "flex-end", gap: 3,
              borderBottom: "1px solid var(--border)", marginBottom: 12,
            }} />

            {/* Bottom stats */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[["4.2M", "Events/sec"], ["99.97%", "Uptime"], ["247", "Suppliers"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <span className="font-orbitron" style={{ fontSize: 12, fontWeight: 600, color: "var(--silver-bright)", display: "block" }}>{v}</span>
                  <span style={{ fontSize: 8, color: "var(--text-dim)", letterSpacing: 1, textTransform: "uppercase" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ position: "relative", zIndex: 2, padding: "52px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: 4, color: "var(--mint)", textTransform: "uppercase" }}>Capabilities</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <h2 className="font-orbitron" style={{ fontSize: 20, fontWeight: 700, color: "var(--silver-bright)", letterSpacing: -0.5, marginBottom: 10 }}>
          Built for Mission-Critical Operations
        </h2>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1,
          background: "var(--border)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden",
        }}>
          {FEATURES.map(f => (
            <div key={f.name} style={{ background: "var(--surface)", padding: "24px 22px" }}>
              <div style={{
                width: 34, height: 34, border: "1px solid var(--border-mint)", borderRadius: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14, background: "rgba(0,245,196,0.05)",
                color: "var(--mint)", fontSize: 16,
              }}>
                {f.icon}
              </div>
              <div className="font-orbitron" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "var(--silver-bright)", marginBottom: 7 }}>
                {f.name}
              </div>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Metrics strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1,
          background: "var(--border)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", marginTop: 32,
        }}>
          {METRICS.map(m => (
            <div key={m.sub} style={{ background: "var(--surface)", padding: 22, textAlign: "center" }}>
              <span className="font-orbitron" style={{ fontSize: 24, fontWeight: 700, color: "var(--mint)", display: "block", marginBottom: 3 }}>{m.num}</span>
              <span style={{ fontSize: 9, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase" }}>{m.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="card-mint-edge" style={{
        position: "relative", zIndex: 2, margin: "0 40px 48px",
        background: "var(--surface)", border: "1px solid var(--border-mint)", borderRadius: 4,
        padding: "40px 52px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 40, overflow: "hidden",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span className="font-orbitron" style={{ fontWeight: 700, fontSize: 22, letterSpacing: 5, color: "var(--silver-bright)" }}>RAVRO</span>
          </div>
          <h3 className="font-orbitron" style={{ fontSize: 18, fontWeight: 700, color: "var(--silver-bright)", marginBottom: 6, letterSpacing: -0.5 }}>
            Ready to engage full capability?
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Start your 14-day trial. No credit card required.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <Link href="/login" className="font-grotesk" style={{
            fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
            color: "var(--obsidian)", background: "var(--mint)", border: "none",
            padding: "13px 30px", borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Request Access
          </Link>
          <button className="font-grotesk" style={{
            fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
            color: "var(--silver)", background: "transparent", border: "1px solid var(--border)",
            padding: "13px 30px", borderRadius: 2, cursor: "pointer",
          }}>
            Schedule Demo
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        position: "relative", zIndex: 2, borderTop: "1px solid var(--border)",
        padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span className="font-orbitron" style={{ fontSize: 10, letterSpacing: 4, color: "var(--text-dim)", fontWeight: 600 }}>RAVRO</span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "API", "Status"].map(l => (
            <a key={l} href="#" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-dim)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: 1 }}>© 2026 Ravro. All rights reserved.</span>
      </footer>

    </div>
  );
}
