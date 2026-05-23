"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats, getAdminBatches, type AdminBatch } from "@/lib/api";

const sections = [
  { href: "/admin/users",     title: "User Management",     desc: "View, edit roles, and remove users."                        },
  { href: "/admin/suppliers", title: "Supplier Onboarding", desc: "Review suppliers, set trust scores, manage categories."     },
  { href: "/admin/health",    title: "System Health",       desc: "Service status, DB connection, uptime, queue."              },
  { href: "/admin/logs",      title: "Logs & Events",       desc: "Request logs, errors, and system events."                   },
  { href: "/admin/flags",     title: "Feature Flags",       desc: "Toggle features on/off without deploying."                  },
  { href: "/admin/overrides", title: "Manual Overrides",    desc: "Trigger scoring, mark stale, reseed, and more."             },
];

function batchStatusColor(s: string): string {
  return s === "done" ? "var(--mint)" : s === "processing" ? "var(--amber)" : s === "failed" ? "var(--red)" : "var(--text-dim)";
}

export default function AdminPage() {
  const [stats,   setStats]   = useState<{ users: number; suppliers: number; products: number; pendingProducts: number; activeBatches: number } | null>(null);
  const [batches, setBatches] = useState<AdminBatch[]>([]);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
    getAdminBatches().then(r => setBatches(r.batches.slice(0, 5))).catch(() => {});
  }, []);

  const statCards = [
    { label: "Total Users",      value: stats?.users,           warn: false },
    { label: "Suppliers",        value: stats?.suppliers,        warn: false },
    { label: "Catalog Products", value: stats?.products,         warn: false },
    { label: "Pending Products", value: stats?.pendingProducts,  warn: (stats?.pendingProducts ?? 0) > 0 },
    { label: "Active Batches",   value: stats?.activeBatches,    warn: (stats?.activeBatches ?? 0) > 0   },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)" }} className="font-orbitron">ADMIN</div>
          <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 2, background: "rgba(255,75,110,0.08)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.25)", letterSpacing: 1 }} className="font-orbitron">RESTRICTED</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Admin Console</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Internal system management for Ravro staff</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 24 }}>
        {statCards.map(({ label, value, warn }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5, letterSpacing: 0.3 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: warn ? "var(--amber)" : "var(--text-primary)", lineHeight: 1 }}>{value === undefined ? "—" : value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        {sections.map(({ href, title, desc }) => (
          <Link key={href} href={href} style={{
            display: "block", background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "16px 18px", textDecoration: "none", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,75,110,0.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{title}</h2>
            <p style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>{desc}</p>
          </Link>
        ))}
      </div>

      {batches.length > 0 && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: 7, letterSpacing: 2, color: "var(--text-dim)" }} className="font-orbitron">
            RECENT INGESTION BATCHES
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["File","Type","Rows","Errors","Status","Date"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-primary)" }}>{b.filename}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-secondary)", textTransform: "capitalize" }}>{b.type}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-secondary)" }}>{b.total_rows}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: b.error_count > 0 ? "var(--red)" : "var(--text-dim)" }}>{b.error_count}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: batchStatusColor(b.status), textTransform: "capitalize" }}>{b.status}</td>
                  <td style={{ padding: "10px 16px", fontSize: 10, color: "var(--text-dim)" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
