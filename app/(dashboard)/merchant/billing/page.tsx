"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getBilling, getBillingPlans, createCheckout, createPortal,
  cancelSubscription, getBillingInvoices, upgradePlanDemo,
  type BillingOverview, type BillingPlan, type BillingInvoice,
} from "@/lib/api";

// ─── Usage meter ──────────────────────────────────────────────────────────────
function UsageMeter({ metric, used, limit, pct }: { metric: string; used: number; limit: number; pct: number }) {
  const warn = pct >= 80;
  const barColor = limit === -1 ? "var(--mint)" : warn ? "var(--amber)" : "var(--mint)";
  const label = metric.replace(/_/g, " ");

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "capitalize", letterSpacing: 0.3 }}>{label}</span>
        <span style={{ fontSize: 10, color: warn ? "var(--amber)" : "var(--text-secondary)" }}>
          {limit === -1
            ? `${used.toLocaleString()} · unlimited`
            : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div style={{ height: 3, background: "var(--surface3)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: limit === -1 ? "100%" : `${Math.min(pct, 100)}%`,
          background: barColor,
          borderRadius: 2,
          transition: "width 0.4s",
          boxShadow: `0 0 6px ${barColor}60`,
        }} />
      </div>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, current, onUpgrade, loading, stripeConfigured }: {
  plan: BillingPlan; current: boolean; onUpgrade: (id: string) => void;
  loading: boolean; stripeConfigured: boolean;
}) {
  const price  = plan.price == null ? "Custom" : plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(0)}`;
  const period = plan.interval ? "/mo" : "";
  const highlight = plan.id === "pro";
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      background: "var(--surface2)",
      border: `1px solid ${current ? "var(--border-mint)" : highlight ? "rgba(184,188,200,0.2)" : "var(--border)"}`,
      borderRadius: 6,
      padding: "18px 16px",
      display: "flex",
      flexDirection: "column",
      boxShadow: current ? "0 0 18px rgba(0,245,196,0.08)" : "none",
      transition: "border-color 0.2s",
    }}>
      {/* Badges */}
      <div style={{ marginBottom: 10, minHeight: 22 }}>
        {highlight && !current && (
          <span style={{
            fontSize: 8, letterSpacing: 1.2, padding: "2px 7px", borderRadius: 2,
            background: "rgba(0,245,196,0.12)", color: "var(--mint)",
            border: "1px solid var(--border-mint)",
          }} className="font-orbitron">MOST POPULAR</span>
        )}
        {current && (
          <span style={{
            fontSize: 8, letterSpacing: 1.2, padding: "2px 7px", borderRadius: 2,
            background: "rgba(0,245,196,0.08)", color: "var(--mint)",
            border: "1px solid var(--border-mint)",
          }} className="font-orbitron">CURRENT PLAN</span>
        )}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{plan.name}</div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{price}</span>
        {period && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{period}</span>}
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", flex: 1 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
            <span style={{ color: "var(--mint)", fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5 }}>{f}</span>
          </li>
        ))}
      </ul>

      {current ? (
        <button disabled style={{
          width: "100%", padding: "8px 0", borderRadius: 4,
          fontSize: 10, background: "var(--surface3)",
          color: "var(--text-dim)", border: "1px solid var(--border)", cursor: "default",
        }}>Current plan</button>
      ) : plan.price === null ? (
        <a href="mailto:sales@ravro.com" style={{
          display: "block", textAlign: "center", padding: "8px 0", borderRadius: 4,
          fontSize: 10, background: "var(--surface3)",
          color: "var(--text-secondary)", border: "1px solid var(--border)",
          textDecoration: "none", transition: "border-color 0.15s",
        }}>Contact sales</a>
      ) : (
        <button
          onClick={() => onUpgrade(plan.id)}
          disabled={loading}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 4, fontSize: 10,
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1, transition: "all 0.15s",
            background: highlight
              ? (hovered ? "var(--mint-dim)" : "var(--mint)")
              : (hovered ? "var(--surface3)" : "var(--surface)"),
            color: highlight ? "var(--obsidian)" : "var(--text-primary)",
            border: highlight ? "none" : "1px solid var(--border)",
          }}
        >
          {loading ? "Loading…" : stripeConfigured ? "Upgrade" : "Upgrade (demo)"}
        </button>
      )}
    </div>
  );
}

// ─── Trial banner ─────────────────────────────────────────────────────────────
function TrialBanner({ days }: { days: number }) {
  const urgent = days <= 3;
  return (
    <div style={{
      padding: "14px 18px", marginBottom: 20, borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: urgent ? "rgba(255,75,110,0.06)" : "rgba(255,184,77,0.06)",
      border: `1px solid ${urgent ? "rgba(255,75,110,0.25)" : "rgba(255,184,77,0.25)"}`,
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: urgent ? "var(--red)" : "var(--amber)", margin: 0 }}>
          {days === 0 ? "Your free trial has ended" : `${days} day${days !== 1 ? "s" : ""} left in your free trial`}
        </p>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: "3px 0 0" }}>
          {days === 0
            ? "Upgrade to Pro to continue accessing all features."
            : "Upgrade before your trial ends to keep full access."}
        </p>
      </div>
      <span style={{ fontSize: 22, fontWeight: 700, color: urgent ? "var(--red)" : "var(--amber)", marginLeft: 16 }}>
        {days}d
      </span>
    </div>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "var(--surface3)", borderRadius: 4, padding: "12px 14px",
      border: "1px solid var(--border)",
    }}>
      <div style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: 0.3, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────
function BillingContent() {
  const searchParams = useSearchParams();
  const [data,      setData]      = useState<BillingOverview | null>(null);
  const [plans,     setPlans]     = useState<BillingPlan[]>([]);
  const [invoices,  setInvoices]  = useState<BillingInvoice[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling,setCancelling]= useState(false);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [b, p, inv] = await Promise.allSettled([getBilling(), getBillingPlans(), getBillingInvoices()]);
    if (b.status   === "fulfilled") setData(b.value);
    if (p.status   === "fulfilled") setPlans(p.value.plans);
    if (inv.status === "fulfilled") setInvoices(inv.value.invoices);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (searchParams.get("success"))   showToast("Subscription updated successfully!", true);
    if (searchParams.get("cancelled")) showToast("Checkout cancelled.", false);
  }, [load, searchParams]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(true);
    try {
      if (data?.stripe_configured) {
        const r = await createCheckout(planId);
        window.location.href = r.url;
      } else {
        await upgradePlanDemo(planId);
        await load();
        showToast(`Upgraded to ${planId} (demo mode — no charge)`, true);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Upgrade failed", false);
    } finally { setUpgrading(false); }
  }

  async function handlePortal() {
    try {
      const r = await createPortal();
      window.location.href = r.url;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Portal unavailable", false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel at end of billing period? You'll keep access until then.")) return;
    setCancelling(true);
    await cancelSubscription();
    await load();
    showToast("Subscription will cancel at the end of the period.", true);
    setCancelling(false);
  }

  const sub    = data?.subscription;
  const plan   = data?.plan;
  const stripe = data?.stripe_configured ?? false;
  const trial  = data?.trial_days_remaining;

  const statusColor: Record<string, string> = {
    active:    "var(--mint)",
    trialing:  "var(--amber)",
    past_due:  "var(--red)",
    cancelled: "var(--text-dim)",
  };

  const invoiceStatusColor: Record<string, string> = {
    success: "var(--mint)",
    failed:  "var(--red)",
    pending: "var(--amber)",
  };

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">
          ACCOUNT
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Billing & Usage</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
          Manage your subscription and monitor usage
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          borderRadius: 4, padding: "10px 14px", marginBottom: 18, fontSize: 11,
          background: toast.ok ? "rgba(0,245,196,0.06)" : "rgba(255,75,110,0.06)",
          border: `1px solid ${toast.ok ? "rgba(0,245,196,0.25)" : "rgba(255,75,110,0.25)"}`,
          color: toast.ok ? "var(--mint)" : "var(--red)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Demo mode banner */}
      {!stripe && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          background: "var(--surface2)", border: "1px solid var(--border)",
          borderRadius: 4, padding: "11px 14px", marginBottom: 20,
        }}>
          <span style={{ color: "var(--amber)", fontSize: 13, flexShrink: 0 }}>⚡</span>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Demo mode</span>
            {" "}— Stripe keys not configured. Upgrades apply instantly without charge.
            {" "}Add{" "}
            <code style={{ color: "var(--mint)", fontSize: 9 }}>STRIPE_SECRET_KEY</code>
            {" "}to{" "}
            <code style={{ color: "var(--mint)", fontSize: 9 }}>.env</code>
            {" "}to enable real payments.
          </p>
        </div>
      )}

      {/* Trial banner */}
      {trial != null && trial >= 0 && sub?.status === "trialing" && <TrialBanner days={trial} />}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 80, borderRadius: 4,
              background: "var(--surface2)", border: "1px solid var(--border)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      ) : (
        <>
          {/* Current plan strip */}
          {sub && plan && (
            <div style={{
              background: "var(--surface2)", border: "1px solid var(--border-mint)",
              borderRadius: 4, padding: "16px 20px", marginBottom: 24,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 0 20px rgba(0,245,196,0.05)",
            }}>
              <div>
                <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">
                  CURRENT PLAN
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 8, letterSpacing: 1, padding: "2px 7px", borderRadius: 2,
                    border: `1px solid ${statusColor[sub.status] ?? "var(--border)"}40`,
                    background: `${statusColor[sub.status] ?? "var(--text-dim)"}12`,
                    color: statusColor[sub.status] ?? "var(--text-dim)",
                    textTransform: "capitalize",
                  }}>
                    {sub.status}
                  </span>
                  {sub.current_period_end && (
                    <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                      {sub.cancel_at_period_end ? "Cancels" : "Renews"}{" "}
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {plan.price && plan.price > 0 && (
                  <>
                    <button onClick={handlePortal} style={{
                      fontSize: 10, padding: "7px 14px", borderRadius: 4,
                      background: "var(--surface3)", color: "var(--mint)",
                      border: "1px solid var(--border-mint)", cursor: "pointer",
                    }}>Manage</button>
                    {!sub.cancel_at_period_end && (
                      <button onClick={handleCancel} disabled={cancelling} style={{
                        fontSize: 10, padding: "7px 14px", borderRadius: 4,
                        background: "var(--surface3)", color: "var(--text-secondary)",
                        border: "1px solid var(--border)", cursor: "pointer",
                        opacity: cancelling ? 0.5 : 1,
                      }}>
                        {cancelling ? "…" : "Cancel"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Usage */}
          {data?.meters && data.meters.length > 0 && (
            <div style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 4, padding: "18px 20px", marginBottom: 24,
            }}>
              <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 14 }} className="font-orbitron">
                USAGE THIS MONTH
              </div>
              {data.meters.map(m => <UsageMeter key={m.metric} {...m} />)}
            </div>
          )}

          {/* Plans */}
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 14 }} className="font-orbitron">
            PLANS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
            {plans.map(p => (
              <PlanCard
                key={p.id}
                plan={p}
                current={sub?.plan === p.id}
                onUpgrade={handleUpgrade}
                loading={upgrading}
                stripeConfigured={stripe}
              />
            ))}
          </div>

          {/* Billing history */}
          <div style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 4, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--border)",
              fontSize: 7, letterSpacing: 2, color: "var(--text-dim)",
            }} className="font-orbitron">
              BILLING HISTORY
            </div>
            {invoices.length === 0 ? (
              <div style={{
                padding: "28px 0", textAlign: "center",
                fontSize: 10, color: "var(--text-dim)",
              }}>
                No billing events yet
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Date", "Description", "Amount", "Status"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "10px 20px",
                        fontSize: 8, letterSpacing: 1, color: "var(--text-dim)",
                        fontWeight: 600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 20px", fontSize: 10, color: "var(--text-secondary)" }}>
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "10px 20px", fontSize: 10, color: "var(--text-primary)" }}>
                        {inv.description ?? inv.type}
                      </td>
                      <td style={{ padding: "10px 20px", fontSize: 10, color: "var(--text-primary)" }}>
                        {inv.amount != null ? `$${(inv.amount / 100).toFixed(2)}` : "—"}
                      </td>
                      <td style={{ padding: "10px 20px" }}>
                        <span style={{
                          fontSize: 9, fontWeight: 600, textTransform: "capitalize",
                          color: invoiceStatusColor[inv.status] ?? "var(--text-secondary)",
                        }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div style={{ fontSize: 10, color: "var(--text-dim)", padding: 16 }}>Loading billing…</div>
    }>
      <BillingContent />
    </Suspense>
  );
}
