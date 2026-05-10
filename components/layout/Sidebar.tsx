"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/api";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

const merchantNav = [
  { href: "/merchant",                  label: "Dashboard"       },
  { href: "/merchant/intelligence",     label: "Intelligence"    },
  { href: "/merchant/trends",           label: "Trends"          },
  { href: "/merchant/recommendations",  label: "Recommendations" },
  { href: "/merchant/workflows",        label: "Workflows"       },
  { href: "/merchant/automation",       label: "Automation"      },
  { href: "/merchant/inventory",        label: "Inventory Sync"  },
  { href: "/merchant/integrations",     label: "Integrations"    },
  { href: "/merchant/billing",          label: "Billing"         },
  { href: "/developer",                 label: "Developer"       },
  { href: "/settings",                  label: "Settings"        },
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
  { href: "/admin",                label: "Console"         },
  { href: "/admin/users",          label: "Users"           },
  { href: "/admin/suppliers",      label: "Onboarding"      },
  { href: "/admin/health",         label: "Health"          },
  { href: "/admin/logs",           label: "Logs"            },
  { href: "/admin/flags",          label: "Feature Flags"   },
  { href: "/admin/overrides",      label: "Overrides"       },
  { href: "/admin/scoring",        label: "Scoring Models"  },
  { href: "/admin/rbac",           label: "RBAC"            },
  { href: "/admin/observability",  label: "Observability"   },
  { href: "/developer",            label: "Developer"       },
  { href: "/settings",             label: "Settings"        },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => { setUser(getCurrentUser()); }, []);

  const nav =
    user?.role === "merchant" ? merchantNav :
    user?.role === "supplier" ? supplierNav :
    adminNav;

  return (
    <aside style={{
      width: 170, flexShrink: 0, background: "var(--surface)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", minHeight: "100vh",
    }}>
      {/* Logo */}
      <div style={{
        height: 44, display: "flex", alignItems: "center", gap: 9,
        padding: "0 18px", borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <span className="font-orbitron" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: "var(--silver-bright)" }}>
          RAVRO
        </span>
      </div>

      {/* Role badge */}
      {user && (
        <div style={{
          padding: "8px 18px 0", fontSize: 7, letterSpacing: 2.5,
          color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600,
        }} className="font-orbitron">
          {user.role}
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "10px 10px 0", overflowY: "auto" }}>
        {nav.map(({ href, label }) => {
          const isRoot   = ["/merchant","/supplier","/admin"].includes(href);
          const isActive = pathname === href || (!isRoot && pathname.startsWith(href));

          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "6px 8px",
              borderRadius: 2, marginBottom: 1, fontSize: 10,
              letterSpacing: 0.3, textDecoration: "none", fontWeight: 400,
              transition: "all 0.15s",
              background:    isActive ? "rgba(0,245,196,0.08)" : "transparent",
              color:         isActive ? "var(--mint)"          : "var(--text-secondary)",
              borderLeft:    isActive ? "2px solid var(--mint)" : "2px solid transparent",
            }}>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        {user && (
          <p style={{ fontSize: 9, color: "var(--text-dim)", padding: "0 8px", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
        )}
        <button onClick={logout} style={{
          width: "100%", textAlign: "left", padding: "6px 8px", borderRadius: 2,
          fontSize: 10, color: "var(--text-secondary)", background: "none",
          border: "none", cursor: "pointer", transition: "all 0.15s",
          fontFamily: "'Space Grotesk',sans-serif",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,75,110,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLElement).style.background = "none"; }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
