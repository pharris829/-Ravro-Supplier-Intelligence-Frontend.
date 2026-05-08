"use client";

import { useState } from "react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    period: "Free forever",
    features: ["500 products", "1 storefront", "Basic scoring", "Community support"],
    cta: "Current plan",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "per month",
    features: ["10,000 products", "3 storefronts", "Full scoring + demand signals", "5 automations", "Priority support"],
    cta: "Upgrade to Pro",
    current: false,
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    features: ["Unlimited products", "Unlimited storefronts", "Custom scoring weights", "Unlimited automations", "Dedicated support"],
    cta: "Contact sales",
    current: false,
  },
];

interface UsageMeter {
  label: string;
  used: number;
  limit: number;
  unit: string;
}

const USAGE: UsageMeter[] = [
  { label: "Products cataloged",  used: 247,  limit: 500,   unit: "products"     },
  { label: "API calls this month", used: 1820, limit: 5000,  unit: "calls"        },
  { label: "Storefront syncs",     used: 38,   limit: 100,   unit: "syncs"        },
  { label: "Automations",          used: 0,    limit: 1,     unit: "active rules" },
];

const INVOICES = [
  { date: "Apr 1, 2026", amount: "$0.00", status: "paid",    plan: "Starter" },
  { date: "Mar 1, 2026", amount: "$0.00", status: "paid",    plan: "Starter" },
  { date: "Feb 1, 2026", amount: "$0.00", status: "paid",    plan: "Starter" },
];

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState<string | null>(null);

  function handleUpgrade(planId: string) {
    setUpgrading(planId);
    setTimeout(() => setUpgrading(null), 1500);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Billing & Usage</h1>
        <p className="text-sm text-neutral-400 mt-1">Manage your plan and monitor usage</p>
      </div>

      {/* Current plan banner */}
      <div className="bg-indigo-950 border border-indigo-800 rounded-xl p-5 mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-400 mb-0.5">Current plan</p>
          <p className="text-lg font-semibold text-white">Starter — Free</p>
          <p className="text-xs text-indigo-300 mt-1">Renews automatically · No payment method required</p>
        </div>
        <button onClick={() => handleUpgrade("pro")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          Upgrade to Pro
        </button>
      </div>

      {/* Usage meters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-white mb-5">Usage this month</h2>
        <div className="space-y-5">
          {USAGE.map(({ label, used, limit, unit }) => {
            const pct = Math.min((used / limit) * 100, 100);
            const warn = pct >= 80;
            return (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-400">{label}</span>
                  <span className={warn ? "text-yellow-400" : "text-neutral-400"}>
                    {used.toLocaleString()} / {limit.toLocaleString()} {unit}
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${warn ? "bg-yellow-500" : "bg-indigo-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-sm font-semibold text-white mb-4">Plans</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {PLANS.map(plan => (
          <div key={plan.id} className={`bg-neutral-900 rounded-xl p-5 border ${plan.highlight ? "border-indigo-600" : "border-neutral-800"}`}>
            {plan.highlight && (
              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full mb-3 inline-block">Most popular</span>
            )}
            <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-2xl font-bold text-white">{plan.price}</span>
              <span className="text-xs text-neutral-500 ml-1">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="text-indigo-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              disabled={plan.current || upgrading === plan.id}
              onClick={() => !plan.current && handleUpgrade(plan.id)}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                plan.current
                  ? "bg-neutral-800 text-neutral-500 cursor-default"
                  : plan.highlight
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "bg-neutral-800 hover:bg-neutral-700 text-white"
              }`}
            >
              {upgrading === plan.id ? "Processing…" : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Invoice history */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white">Billing history</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              {["Date", "Plan", "Amount", "Status"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-neutral-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => (
              <tr key={i} className="border-b border-neutral-800/50">
                <td className="px-5 py-3 text-neutral-300 text-xs">{inv.date}</td>
                <td className="px-5 py-3 text-neutral-400 text-xs">{inv.plan}</td>
                <td className="px-5 py-3 text-neutral-300 text-xs">{inv.amount}</td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
