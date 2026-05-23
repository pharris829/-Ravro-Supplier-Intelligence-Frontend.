"use client";

import Link from "next/link";

const PERKS = [
  {
    icon: "◈",
    title: "Instant Product Visibility",
    desc: "Your catalog reaches thousands of active merchants the moment you list. Zero cold-start lag.",
  },
  {
    icon: "◉",
    title: "Intelligence Scoring",
    desc: "Real-time demand signals and opportunity scores tell you which products to push and when.",
  },
  {
    icon: "⬡",
    title: "Catalog Analytics",
    desc: "Track views, inquiries, and conversion by SKU. Know exactly what's working.",
  },
  {
    icon: "◈",
    title: "API & Webhook Sync",
    desc: "Connect your existing inventory system. Push updates in real time via REST or webhooks.",
  },
];

const STEPS = [
  { n: "01", label: "Create your account" },
  { n: "02", label: "Upload your catalog" },
  { n: "03", label: "Go live in minutes" },
];

export default function SupplierPortalPage() {
  return (
    <div className="grid-bg" style={{ background: "var(--obsidian)", minHeight: "100vh", position: "relative" }}>

      {/* NAV */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 40px", borderBottom: "1px solid var(--border)",
        background: "rgba(8,10,15,0.9)", backdropFilter: "blur(12px)",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-orbitron" style={{ fontWeight: 700, fontSize: 16, letterSpacing: 4, color: "var(--silver-bright)" }}>
            RAVRO
          </span>
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{
            fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, letterSpacing: 2,
            textTransform: "uppercase", fontWeight: 600, color: "var(--silver)",
            background: "none", border: "1px solid var(--border)", padding: "7px 18px",
            borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position: "relative", zIndex: 2,
        padding: "72px 40px 56px", maxWidth: 860, margin: "0 auto", textAlign: "center",
      }}>
        <div className="font-orbitron" style={{
          fontSize: 9, letterSpacing: 4, color: "var(--mint)", textTransform: "uppercase",
          marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <span style={{ width: 28, height: 1, background: "var(--mint)", display: "inline-block" }} />
          Supplier Portal
          <span style={{ width: 28, height: 1, background: "var(--mint)", display: "inline-block" }} />
        </div>

        <h1 className="font-orbitron" style={{
          fontSize: 38, fontWeight: 900, lineHeight: 1.15, letterSpacing: -1,
          color: "var(--silver-bright)", marginBottom: 20,
        }}>
          Reach Merchants.<br />
          Move <span style={{ color: "var(--mint)" }}>Product.</span>
        </h1>

        <p style={{
          fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)",
          maxWidth: 520, margin: "0 auto 36px",
        }}>
          Join the Ravro supplier network and get your catalog in front of high-intent merchants
          using real-time intelligence to source their next product line.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login?mode=register&role=supplier" className="font-grotesk" style={{
            fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
            color: "var(--obsidian)", background: "var(--mint)", border: "none",
            padding: "14px 36px", borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Create Supplier Account
          </Link>
          <Link href="/login" className="font-grotesk" style={{
            fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
            color: "var(--silver)", background: "transparent", border: "1px solid var(--border)",
            padding: "14px 36px", borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Sign In to Portal
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: "relative", zIndex: 2, padding: "0 40px 52px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border-mint)",
                borderRadius: 4, padding: "20px 28px", textAlign: "center", minWidth: 160,
              }}>
                <span className="font-orbitron" style={{ fontSize: 18, fontWeight: 700, color: "var(--mint)", display: "block", marginBottom: 6 }}>
                  {s.n}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", letterSpacing: 0.5 }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 1, background: "var(--border-mint)", flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PERKS */}
      <section style={{ position: "relative", zIndex: 2, padding: "0 40px 56px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: 4, color: "var(--mint)", textTransform: "uppercase" }}>
            Why Ravro
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1,
          background: "var(--border)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden",
        }}>
          {PERKS.map(p => (
            <div key={p.title} style={{ background: "var(--surface)", padding: "26px 24px" }}>
              <div style={{
                width: 34, height: 34, border: "1px solid var(--border-mint)", borderRadius: 3,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14, background: "rgba(0,245,196,0.05)",
                color: "var(--mint)", fontSize: 16,
              }}>
                {p.icon}
              </div>
              <div className="font-orbitron" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "var(--silver-bright)", marginBottom: 8 }}>
                {p.title}
              </div>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="card-mint-edge" style={{
        position: "relative", zIndex: 2, margin: "0 40px 48px",
        background: "var(--surface)", border: "1px solid var(--border-mint)", borderRadius: 4,
        padding: "40px 52px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 40, overflow: "hidden",
      }}>
        <div>
          <h3 className="font-orbitron" style={{ fontSize: 18, fontWeight: 700, color: "var(--silver-bright)", marginBottom: 6, letterSpacing: -0.5 }}>
            Ready to list your catalog?
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Free to join. Reach merchants actively sourcing right now.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <Link href="/login?mode=register&role=supplier" className="font-grotesk" style={{
            fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
            color: "var(--obsidian)", background: "var(--mint)", border: "none",
            padding: "13px 30px", borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Get Started Free
          </Link>
          <Link href="/login" className="font-grotesk" style={{
            fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700,
            color: "var(--silver)", background: "transparent", border: "1px solid var(--border)",
            padding: "13px 30px", borderRadius: 2, textDecoration: "none", display: "inline-block",
          }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: "relative", zIndex: 2, borderTop: "1px solid var(--border)",
        padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-orbitron" style={{ fontSize: 10, letterSpacing: 4, color: "var(--text-dim)", fontWeight: 600 }}>RAVRO</span>
        </Link>
        <span style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: 1 }}>© 2026 Ravro. All rights reserved.</span>
      </footer>

    </div>
  );
}
