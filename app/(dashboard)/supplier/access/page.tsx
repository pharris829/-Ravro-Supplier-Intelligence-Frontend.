"use client";

import { useState, useEffect } from "react";

type RequestStatus = "pending" | "approved" | "denied";

interface AccessRequest {
  id: string;
  merchantName: string;
  merchantEmail: string;
  store: string;
  requestedAt: string;
  status: RequestStatus;
  message?: string;
}

const STORAGE_KEY = "ravro_access_requests";

const MOCK_REQUESTS: AccessRequest[] = [
  { id: "req-1", merchantName: "Urban Outpost LLC",    merchantEmail: "buyer@urbanoutpost.com", store: "Shopify",      requestedAt: new Date(Date.now() - 86400000).toISOString(),   status: "pending",  message: "We'd love to carry your ergonomic office range." },
  { id: "req-2", merchantName: "Green Goods Co.",      merchantEmail: "ops@greengoods.io",       store: "WooCommerce",  requestedAt: new Date(Date.now() - 172800000).toISOString(),  status: "pending",  message: "Looking for sustainable lifestyle products." },
  { id: "req-3", merchantName: "TechHub Direct",       merchantEmail: "sourcing@techhub.com",    store: "Shopify",      requestedAt: new Date(Date.now() - 259200000).toISOString(),  status: "approved"  },
  { id: "req-4", merchantName: "Boutique Marketplace", merchantEmail: "hello@boutiquemkt.com",   store: "Etsy",         requestedAt: new Date(Date.now() - 345600000).toISOString(),  status: "denied"    },
];

function load(): AccessRequest[] {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : MOCK_REQUESTS; }
  catch { return MOCK_REQUESTS; }
}
function persist(r: AccessRequest[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

const TAB_LABELS: Record<RequestStatus | "all", string> = { all: "All", pending: "Pending", approved: "Approved", denied: "Denied" };

function statusStyle(s: RequestStatus): React.CSSProperties {
  const map = {
    pending:  { bg: "rgba(255,184,77,0.08)",   color: "var(--amber)", border: "rgba(255,184,77,0.25)"  },
    approved: { bg: "rgba(0,245,196,0.08)",    color: "var(--mint)",  border: "rgba(0,245,196,0.25)"   },
    denied:   { bg: "rgba(255,75,110,0.08)",   color: "var(--red)",   border: "rgba(255,75,110,0.25)"  },
  }[s];
  return { fontSize: 8, padding: "2px 7px", borderRadius: 2, background: map.bg, color: map.color, border: `1px solid ${map.border}`, letterSpacing: 0.5, textTransform: "capitalize" };
}

function statColor(s: RequestStatus): string {
  return s === "pending" ? "var(--amber)" : s === "approved" ? "var(--mint)" : "var(--red)";
}

export default function MerchantAccessPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [tab, setTab]           = useState<RequestStatus | "all">("pending");

  useEffect(() => { setRequests(load()); }, []);

  function update(id: string, status: RequestStatus) {
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(updated); persist(updated);
  }

  const filtered     = tab === "all" ? requests : requests.filter(r => r.status === tab);
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const tabs = (["all", "pending", "approved", "denied"] as (RequestStatus | "all")[]);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">SUPPLIER</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Merchant Access</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Control which merchants can access your product catalog</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {(["pending","approved","denied"] as RequestStatus[]).map(s => (
          <div key={s} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5, textTransform: "capitalize" }}>{s}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: statColor(s), lineHeight: 1 }}>{requests.filter(r => r.status === s).length}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4, width: "fit-content", marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "4px 12px", borderRadius: 3, fontSize: 10, fontWeight: 500, border: "none", cursor: "pointer",
            background: tab === t ? "var(--mint)" : "transparent",
            color: tab === t ? "var(--obsidian)" : "var(--text-secondary)",
          }}>
            {TAB_LABELS[t]}{t === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>
            No {tab === "all" ? "" : tab} requests.
          </div>
        ) : filtered.map(req => (
          <div key={req.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{req.merchantName}</p>
                  <span style={statusStyle(req.status)}>{req.status}</span>
                  <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{req.store}</span>
                </div>
                <p style={{ fontSize: 10, color: "var(--text-secondary)", margin: 0 }}>{req.merchantEmail}</p>
                {req.message && (
                  <p style={{ fontSize: 10, color: "var(--text-secondary)", fontStyle: "italic", marginTop: 8, background: "var(--surface3)", borderRadius: 4, padding: "6px 10px", border: "1px solid var(--border)" }}>
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}
                <p style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 8 }}>
                  Requested {new Date(req.requestedAt).toLocaleDateString()}
                </p>
              </div>

              {req.status === "pending" && (
                <div style={{ display: "flex", gap: 6, marginLeft: 16, flexShrink: 0 }}>
                  <button onClick={() => update(req.id, "approved")} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 4, background: "rgba(0,245,196,0.08)", color: "var(--mint)", border: "1px solid rgba(0,245,196,0.25)", cursor: "pointer" }}>Approve</button>
                  <button onClick={() => update(req.id, "denied")}   style={{ fontSize: 10, padding: "5px 12px", borderRadius: 4, background: "rgba(255,75,110,0.08)", color: "var(--red)",  border: "1px solid rgba(255,75,110,0.25)", cursor: "pointer" }}>Deny</button>
                </div>
              )}
              {req.status !== "pending" && (
                <button onClick={() => update(req.id, "pending")} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 4, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer", marginLeft: 16, flexShrink: 0 }}>Reset</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
