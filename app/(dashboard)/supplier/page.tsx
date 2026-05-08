"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMySupplierProfile, getSupplierProducts, type Supplier } from "@/lib/api";

const sections = [
  { href: "/supplier/products",  title: "Product Feeds",    desc: "Manage your catalog, update pricing, stock, and lead times." },
  { href: "/supplier/access",    title: "Merchant Access",  desc: "Approve or deny merchant requests to use your catalog." },
  { href: "/supplier/analytics", title: "Analytics",        desc: "Track merchant activity and product performance." },
  { href: "/ingest",             title: "Ingest CSV",       desc: "Upload new products via CSV file." },
];

export default function SupplierPage() {
  const [profile, setProfile]       = useState<Supplier | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    getMySupplierProfile().then(p => {
      setProfile(p);
      if (p) {
        getSupplierProducts(p.id, { limit: 1 } as never)
          .then(r => setProductCount(r.pagination?.total ?? r.products.length))
          .catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Total Products",      value: productCount },
    { label: "Trust Score",         value: profile?.trust_score?.toFixed(1) ?? null },
    { label: "Reliability Score",   value: profile?.reliability_score?.toFixed(1) ?? null },
    { label: "Pending Requests",    value: 0 },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 flex items-start justify-between">
        <div>
          {loading ? (
            <div className="h-7 w-40 bg-neutral-800 rounded animate-pulse mb-2" />
          ) : (
            <h1 className="text-xl font-semibold text-white mb-1">{profile?.name ?? "Supplier Portal"}</h1>
          )}
          <div className="flex gap-2 flex-wrap">
            {profile?.categories?.map(c => (
              <span key={c} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">{c}</span>
            ))}
            {profile?.country && (
              <span className="text-xs text-neutral-500">{profile.country}</span>
            )}
          </div>
        </div>
        <Link href="/supplier/products"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Manage Products
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-white">{value === null ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-2 gap-4">
        {sections.map(({ href, title, desc }) => (
          <Link key={href} href={href}
            className="bg-neutral-900 border border-neutral-800 hover:border-indigo-600 rounded-xl p-5 transition-colors group">
            <h2 className="text-sm font-semibold text-white group-hover:text-indigo-400 mb-1">{title}</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
