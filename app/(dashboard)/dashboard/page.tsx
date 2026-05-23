"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSuppliers, searchProducts } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [productCount,  setProductCount]  = useState<number | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === "merchant") { router.replace("/merchant"); return; }
    if (user?.role === "supplier") { router.replace("/supplier"); return; }
    if (user?.role === "admin")    { router.replace("/admin");    return; }
    getSuppliers({ limit: 1 }).then(r => setSupplierCount(r.pagination.total)).catch(() => {});
    searchProducts({ q: "a" } as never).then(r => setProductCount(r.pagination.total)).catch(() => {});
  }, [router]);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">OVERVIEW</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Ravro intelligence overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Suppliers",  value: supplierCount },
          { label: "Catalog Products", value: productCount  },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "18px 20px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value === null ? "—" : value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { href: "/suppliers", title: "Browse Suppliers", desc: "View all suppliers and their catalog." },
          { href: "/products",  title: "Search Products",  desc: "Full-text search across the catalog." },
          { href: "/ingest",    title: "Ingest CSV",       desc: "Upload supplier or product CSV files." },
        ].map(({ href, title, desc }) => (
          <Link key={href} href={href} style={{
            display: "block", background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "14px 16px", textDecoration: "none", transition: "border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mint)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <h2 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{title}</h2>
            <p style={{ fontSize: 10, color: "var(--text-dim)", lineHeight: 1.5 }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
