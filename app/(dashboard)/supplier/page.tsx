"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMySupplierProfile, getSupplierProducts, type Supplier } from "@/lib/api";

const sections = [
  { href: "/supplier/products",  title: "Product Feeds",   desc: "Manage your catalog, update pricing, stock, and lead times." },
  { href: "/supplier/access",    title: "Merchant Access", desc: "Approve or deny merchant requests to use your catalog."     },
  { href: "/supplier/analytics", title: "Analytics",       desc: "Track merchant activity and product performance."            },
  { href: "/ingest",             title: "Ingest CSV",      desc: "Upload new products via CSV file."                          },
];

export default function SupplierPage() {
  const [profile, setProfile]         = useState<Supplier | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    getMySupplierProfile().then(p => {
      setProfile(p);
      if (p) getSupplierProducts(p.id, { limit: 1 } as never)
        .then(r => setProductCount(r.pagination?.total ?? r.products.length))
        .catch(() => {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Total Products",    value: productCount },
    { label: "Trust Score",       value: profile?.trust_score?.toFixed(1) ?? null },
    { label: "Reliability Score", value: profile?.reliability_score?.toFixed(1) ?? null },
    { label: "Pending Requests",  value: 0 },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Profile header */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", boxShadow: "0 0 20px rgba(0,245,196,0.05)" }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">SUPPLIER</div>
          {loading ? (
            <div style={{ height: 20, width: 160, background: "var(--surface3)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
          ) : (
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{profile?.name ?? "Supplier Portal"}</h1>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {profile?.categories?.map(c => (
              <span key={c} style={{ fontSize: 8, padding: "2px 7px", borderRadius: 2, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>{c}</span>
            ))}
            {profile?.country && <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{profile.country}</span>}
          </div>
        </div>
        <Link href="/supplier/products" style={{
          background: "var(--mint)", color: "var(--obsidian)", borderRadius: 4,
          padding: "8px 16px", fontSize: 11, fontWeight: 600, textDecoration: "none",
        }}>Manage Products</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5, letterSpacing: 0.3 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value === null ? "—" : value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {sections.map(({ href, title, desc }) => (
          <Link key={href} href={href} style={{
            display: "block", background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "18px 20px", textDecoration: "none", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 5 }}>{title}</h2>
            <p style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>{desc}</p>
          </Link>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
