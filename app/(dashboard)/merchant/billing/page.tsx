"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getBilling, getBillingPlans, createCheckout, createPortal,
  cancelSubscription, getBillingInvoices, upgradePlanDemo,
  type BillingOverview, type BillingPlan, type BillingInvoice,
} from "@/lib/api";

// ─── Usage meter bar ──────────────────────────────────────────────────────────
function UsageMeter({ metric, used, limit, pct }: { metric: string; used: number; limit: number; pct: number }) {
  const warn    = pct >= 80;
  const barColor = limit === -1 ? "bg-emerald-500" : warn ? "bg-yellow-500" : "bg-indigo-500";
  const label   = metric.replace("_", " ");

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-neutral-400 capitalize">{label}</span>
        <span className={warn ? "text-yellow-400" : "text-neutral-400"}>
          {limit === -1 ? `${used.toLocaleString()} · unlimited` : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: limit === -1 ? "100%" : `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({
  plan, current, onUpgrade, loading, stripeConfigured
}: {
  plan: BillingPlan; current: boolean; onUpgrade: (id: string) => void;
  loading: boolean; stripeConfigured: boolean;
}) {
  const price = plan.price == null ? "Custom" : plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(0)}`;
  const period = plan.interval ? `/mo` : "";
  const highlight = plan.id === "pro";

  return (
    <div className={`bg-neutral-900 rounded-xl p-5 border ${current ? "border-indigo-600" : highlight ? "border-neutral-600" : "border-neutral-800"}`}>
      {highlight && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full mb-3 inline-block">Most popular</span>}
      {current  && <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded-full mb-3 inline-block">Current plan</span>}

      <h3 className="text-sm font-semibold text-white mb-1">{plan.name}</h3>
      <div className="mb-4">
        <span className="text-2xl font-bold text-white">{price}</span>
        <span className="text-xs text-neutral-500 ml-1">{period}</span>
      </div>

      <ul className="space-y-1.5 mb-5">
        {plan.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="text-indigo-400 shrink-0">✓</span> {f}
          </li>
        ))}
      </ul>

      {current ? (
        <button disabled className="w-full py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-500 cursor-default">
          Current plan
        </button>
      ) : plan.price === null ? (
        <a href="mailto:sales@ravro.com"
          className="block w-full text-center py-2 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white transition-colors">
          Contact sales
        </a>
      ) : (
        <button onClick={() => onUpgrade(plan.id)} disabled={loading}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${highlight ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-white"}`}>
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
    <div className={`rounded-xl p-4 mb-6 border flex items-center justify-between ${urgent ? "bg-red-950/50 border-red-900" : "bg-yellow-950/50 border-yellow-900"}`}>
      <div>
        <p className={`text-sm font-semibold ${urgent ? "text-red-400" : "text-yellow-400"}`}>
          {days === 0 ? "Your free trial has ended" : `${days} day${days !== 1 ? "s" : ""} left in your free trial`}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">
          {days === 0
            ? "Upgrade to Pro to continue accessing all features."
            : "Upgrade before your trial ends to keep full access."}
        </p>
      </div>
      <div className={`text-2xl font-bold ${urgent ? "text-red-400" : "text-yellow-400"} ml-4 shrink-0`}>
        {days}d
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function BillingContent() {
  const searchParams = useSearchParams();
  const [data,     setData]     = useState<BillingOverview | null>(null);
  const [plans,    setPlans]    = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

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
    if (searchParams.get("success")) showToast("Subscription updated successfully!", true);
    if (searchParams.get("cancelled")) showToast("Checkout cancelled.", false);
  }, [load, searchParams]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(true);
    try {
      const stripe = data?.stripe_configured;
      if (stripe) {
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

  const STATUS_STYLES: Record<string, string> = {
    active:   "bg-emerald-950 text-emerald-400 border-emerald-900",
    trialing: "bg-yellow-950 text-yellow-400 border-yellow-900",
    past_due: "bg-red-950 text-red-400 border-red-900",
    cancelled:"bg-neutral-800 text-neutral-500 border-neutral-700",
  };

  const INVOICE_STATUS_COLORS: Record<string, string> = {
    success: "text-emerald-400",
    failed:  "text-red-400",
    pending: "text-yellow-400",
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Billing & Usage</h1>
        <p className="text-sm text-neutral-400 mt-1">Manage your subscription and monitor usage</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-xl px-4 py-3 mb-5 text-sm ${toast.ok ? "bg-emerald-950 border border-emerald-900 text-emerald-400" : "bg-red-950 border border-red-900 text-red-400"}`}>
          {toast.msg}
        </div>
      )}

      {/* Stripe demo banner */}
      {!stripe && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <span className="text-yellow-400 text-lg">⚡</span>
          <p className="text-xs text-neutral-400">
            <span className="text-white font-medium">Demo mode</span> — Stripe keys not configured. Upgrades apply instantly without charge.
            Add <code className="text-indigo-400">STRIPE_SECRET_KEY</code> to <code className="text-indigo-400">.env</code> to enable real payments.
          </p>
        </div>
      )}

      {/* Trial banner */}
      {trial != null && trial >= 0 && sub?.status === "trialing" && <TrialBanner days={trial} />}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Current plan card */}
          {sub && plan && (
            <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-5 mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-400 mb-0.5">Current plan</p>
                <p className="text-lg font-semibold text-white">{plan.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[sub.status] ?? STATUS_STYLES.active}`}>
                    {sub.status}
                  </span>
                  {sub.current_period_end && (
                    <span className="text-xs text-indigo-300">
                      {sub.cancel_at_period_end ? "Cancels" : "Renews"} {new Date(sub.current_period_end).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {plan.price && plan.price > 0 && (
                  <>
                    <button onClick={handlePortal}
                      className="text-sm px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-indigo-300 border border-indigo-700 transition-colors">
                      Manage
                    </button>
                    {!sub.cancel_at_period_end && (
                      <button onClick={handleCancel} disabled={cancelling}
                        className="text-sm px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 disabled:opacity-50 transition-colors">
                        {cancelling ? "…" : "Cancel"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Usage meters */}
          {data?.meters && data.meters.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
              <h2 className="text-sm font-semibold text-white mb-5">Usage this month</h2>
              <div className="space-y-4">
                {data.meters.map(m => <UsageMeter key={m.metric} {...m} />)}
              </div>
            </div>
          )}

          {/* Plans */}
          <h2 className="text-sm font-semibold text-white mb-4">Plans</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
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

          {/* Invoice history */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-800">
              <h2 className="text-sm font-semibold text-white">Billing history</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="px-5 py-6 text-center text-neutral-500 text-sm">No billing events yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800">
                    {["Date","Description","Amount","Status"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-neutral-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-neutral-800/50">
                      <td className="px-5 py-3 text-neutral-400 text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-neutral-300 text-xs">{inv.description ?? inv.type}</td>
                      <td className="px-5 py-3 text-neutral-300 text-xs">
                        {inv.amount != null ? `$${(inv.amount / 100).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium capitalize ${INVOICE_STATUS_COLORS[inv.status] ?? "text-neutral-400"}`}>
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
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="text-neutral-500 text-sm p-4">Loading billing…</div>}>
      <BillingContent />
    </Suspense>
  );
}
