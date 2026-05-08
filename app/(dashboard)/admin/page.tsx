"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats, getAdminBatches, type AdminBatch } from "@/lib/api";

const sections = [
  { href: "/admin/users",     title: "User Management",      desc: "View, edit roles, and remove users." },
  { href: "/admin/suppliers", title: "Supplier Onboarding",  desc: "Review suppliers, set trust scores, manage categories." },
  { href: "/admin/health",    title: "System Health",        desc: "Service status, DB connection, uptime, queue." },
  { href: "/admin/logs",      title: "Logs & Events",        desc: "Request logs, errors, and system events." },
  { href: "/admin/flags",     title: "Feature Flags",        desc: "Toggle features on/off without deploying." },
  { href: "/admin/overrides", title: "Manual Overrides",     desc: "Trigger scoring, mark stale, reseed, and more." },
];

const BATCH_STATUS_STYLES: Record<string, string> = {
  done:       "text-emerald-400",
  processing: "text-yellow-400",
  failed:     "text-red-400",
  pending:    "text-neutral-400",
};

export default function AdminPage() {
  const [stats,   setStats]   = useState<{ users: number; suppliers: number; products: number; pendingProducts: number; activeBatches: number } | null>(null);
  const [batches, setBatches] = useState<AdminBatch[]>([]);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
    getAdminBatches().then(r => setBatches(r.batches.slice(0, 5))).catch(() => {});
  }, []);

  const statCards = [
    { label: "Total Users",      value: stats?.users          },
    { label: "Suppliers",        value: stats?.suppliers      },
    { label: "Catalog Products", value: stats?.products       },
    { label: "Pending Products", value: stats?.pendingProducts, warn: (stats?.pendingProducts ?? 0) > 0 },
    { label: "Active Batches",   value: stats?.activeBatches,  warn: (stats?.activeBatches ?? 0) > 0   },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold text-white">Admin Console</h1>
          <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded">ADMIN</span>
        </div>
        <p className="text-sm text-neutral-400">Internal system management for Ravro staff</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {statCards.map(({ label, value, warn }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${warn ? "text-yellow-400" : "text-white"}`}>
              {value === undefined ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Section links */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {sections.map(({ href, title, desc }) => (
          <Link key={href} href={href}
            className="bg-neutral-900 border border-neutral-800 hover:border-red-800 rounded-xl p-5 transition-colors group">
            <h2 className="text-sm font-semibold text-white group-hover:text-red-400 mb-1">{title}</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent batches */}
      {batches.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800">
            <h2 className="text-sm font-semibold text-white">Recent Ingestion Batches</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {["File", "Type", "Rows", "Errors", "Status", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} className="border-b border-neutral-800/50">
                  <td className="px-4 py-3 text-white text-xs">{b.filename}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs capitalize">{b.type}</td>
                  <td className="px-4 py-3 text-neutral-300 text-xs tabular-nums">{b.total_rows}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={b.error_count > 0 ? "text-red-400" : "text-neutral-500"}>{b.error_count}</span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">
                    <span className={BATCH_STATUS_STYLES[b.status] ?? "text-neutral-400"}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
