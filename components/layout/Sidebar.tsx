"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/api";

const nav = [
  { href: "/dashboard",   label: "Dashboard" },
  { href: "/suppliers",   label: "Suppliers"  },
  { href: "/products",    label: "Products"   },
  { href: "/ingest",      label: "Ingest CSV" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-neutral-800">
        <span className="text-lg font-semibold tracking-tight text-white">Ravro</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-800">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
