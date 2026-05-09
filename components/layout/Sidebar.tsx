"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/api";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

const merchantNav = [
  { href: "/merchant",              label: "Dashboard"        },
  { href: "/merchant/intelligence",     label: "Product Intel"    },
  { href: "/merchant/recommendations", label: "Recommendations"  },
  { href: "/merchant/workflows",       label: "Workflows"         },
  { href: "/merchant/automation",   label: "Automation"       },
  { href: "/merchant/inventory",    label: "Inventory Sync"   },
  { href: "/merchant/integrations", label: "Integrations"     },
  { href: "/merchant/billing",      label: "Billing & Usage"  },
  { href: "/developer",             label: "Developer"        },
  { href: "/settings",              label: "Settings"         },
];

const supplierNav = [
  { href: "/supplier",             label: "Dashboard"       },
  { href: "/supplier/products",    label: "Product Feeds"   },
  { href: "/supplier/access",      label: "Merchant Access" },
  { href: "/supplier/analytics",   label: "Analytics"       },
  { href: "/ingest",               label: "Ingest CSV"      },
  { href: "/developer",            label: "Developer"       },
  { href: "/settings",             label: "Settings"        },
];

const adminNav = [
  { href: "/admin",            label: "Console"       },
  { href: "/admin/users",      label: "Users"         },
  { href: "/admin/suppliers",  label: "Onboarding"    },
  { href: "/admin/health",     label: "Health"        },
  { href: "/admin/logs",       label: "Logs"          },
  { href: "/admin/flags",      label: "Feature Flags" },
  { href: "/admin/overrides",  label: "Overrides"     },
  { href: "/admin/scoring",   label: "Scoring Models" },
  { href: "/admin/rbac",          label: "RBAC"           },
  { href: "/admin/observability", label: "Observability"  },
  { href: "/settings",        label: "Settings"       },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const nav =
    user?.role === "merchant" ? merchantNav :
    user?.role === "supplier" ? supplierNav :
    adminNav;

  return (
    <aside className="w-56 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-neutral-800">
        <span className="text-lg font-semibold tracking-tight text-white">Ravro</span>
        {user && (
          <p className="text-xs text-neutral-500 mt-0.5 capitalize">{user.role}</p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label }) => {
          const isRoot = href === "/merchant" || href === "/supplier" || href === "/admin";
    const active = pathname === href || (!isRoot && pathname.startsWith(href));
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

      <div className="px-3 py-4 border-t border-neutral-800 space-y-1">
        {user && (
          <p className="px-3 py-1 text-xs text-neutral-600 truncate">{user.email}</p>
        )}
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
