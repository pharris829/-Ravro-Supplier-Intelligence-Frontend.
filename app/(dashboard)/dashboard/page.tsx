"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSuppliers, searchProducts } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [productCount, setProductCount]   = useState<number | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === "merchant")  { router.replace("/merchant");  return; }
    if (user?.role === "supplier")  { router.replace("/supplier");  return; }
    getSuppliers({ limit: 1 }).then(r => setSupplierCount(r.pagination.total)).catch(() => {});
    searchProducts({ q: "a" } as never).then(r => setProductCount(r.pagination.total)).catch(() => {});
  }, [router]);

  const stats = [
    { label: "Total Suppliers",  value: supplierCount },
    { label: "Catalog Products", value: productCount  },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Dashboard</h1>
      <p className="text-sm text-neutral-400 mb-8">Ravro intelligence overview</p>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <p className="text-sm text-neutral-400 mb-1">{label}</p>
            <p className="text-3xl font-semibold text-white">{value === null ? "—" : value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/suppliers", title: "Browse Suppliers", desc: "View all suppliers and their catalog." },
          { href: "/products",  title: "Search Products",  desc: "Full-text search across the catalog." },
          { href: "/ingest",    title: "Ingest CSV",       desc: "Upload supplier or product CSV files." },
        ].map(({ href, title, desc }) => (
          <Link key={href} href={href}
            className="bg-neutral-900 border border-neutral-800 hover:border-indigo-600 rounded-xl p-5 transition-colors group">
            <h2 className="text-sm font-medium text-white group-hover:text-indigo-400 mb-1">{title}</h2>
            <p className="text-xs text-neutral-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
