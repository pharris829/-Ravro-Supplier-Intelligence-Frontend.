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
    { label: "Active Suppliers",     value: supplierCount },
    { label: "Catalog Products",     value: productCount  },
    { label: "High-Opportunity",     value: highOpp       },
    { label: "Active Automations",   value: 0             },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-sm text-neutral-400 mt-1">Your Ravro merchant workspace</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className="text-3xl font-semibold text-white">{value === null ? "—" : value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map(({ href, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-neutral-900 border border-neutral-800 hover:border-indigo-600 rounded-xl p-5 transition-colors group"
          >
            <h2 className="text-sm font-semibold text-white group-hover:text-indigo-400 mb-1">{title}</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
