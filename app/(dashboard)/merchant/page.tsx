"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSuppliers, searchProducts } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

const sections = [
  { href: "/merchant/intelligence", title: "Product Intelligence", desc: "Scores, demand signals, saturation, and supplier quality at a glance." },
  { href: "/merchant/automation",   title: "Automation Builder",   desc: "Build trigger-based rules to act on product and market changes." },
  { href: "/merchant/inventory",    title: "Inventory Sync",       desc: "Keep your storefront stock in sync with supplier inventory." },
  { href: "/merchant/integrations", title: "Integrations",         desc: "Connect Shopify, WooCommerce, and Etsy to your Ravro catalog." },
  { href: "/merchant/billing",      title: "Billing & Usage",      desc: "Monitor API usage, sync limits, and manage your plan." },
];

export default function MerchantPage() {
  const user = getCurrentUser();
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [productCount, setProductCount]   = useState<number | null>(null);
  const [highOpp, setHighOpp]             = useState<number | null>(null);

  useEffect(() => {
    getSuppliers({ limit: 1 }).then(r => setSupplierCount(r.pagination.total)).catch(() => {});
    searchProducts({ q: "a" }).then(r => {
      setProductCount(r.pagination.total);
      setHighOpp(r.products.filter(p => (p.match_score ?? 0) >= 0.75).length);
    }).catch(() => {});
  }, []);

  const stats = [
    { label: "Active Suppliers",   value: supplierCount },
    { label: "Catalog Products",   value: productCount  },
    { label: "High-Opportunity",   value: highOpp       },
    { label: "Active Automations", value: 0             },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">
          MERCHANT
        </div>
        <h1 suppressHydrationWarning style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Your Ravro merchant workspace</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 6, letterSpacing: 0.5 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value === null ? "—" : value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {sections.map(({ href, title, desc }) => (
          <Link key={href} href={href} style={{
            display: "block", background: "var(--surface2)",
            border: "1px solid var(--border)", borderRadius: 4, padding: "18px 20px",
            textDecoration: "none", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 5 }}>{title}</h2>
            <p style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
