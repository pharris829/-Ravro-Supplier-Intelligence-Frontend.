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
  { id: "req-1", merchantName: "Urban Outpost LLC",    merchantEmail: "buyer@urbanoutpost.com",  store: "Shopify",      requestedAt: new Date(Date.now() - 86400000).toISOString(),     status: "pending",  message: "We'd love to carry your ergonomic office range." },
  { id: "req-2", merchantName: "Green Goods Co.",      merchantEmail: "ops@greengoods.io",        store: "WooCommerce",  requestedAt: new Date(Date.now() - 172800000).toISOString(),    status: "pending",  message: "Looking for sustainable lifestyle products." },
  { id: "req-3", merchantName: "TechHub Direct",       merchantEmail: "sourcing@techhub.com",     store: "Shopify",      requestedAt: new Date(Date.now() - 259200000).toISOString(),    status: "approved"  },
  { id: "req-4", merchantName: "Boutique Marketplace", merchantEmail: "hello@boutiquemkt.com",    store: "Etsy",         requestedAt: new Date(Date.now() - 345600000).toISOString(),    status: "denied"    },
];

function loadRequests(): AccessRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : MOCK_REQUESTS;
  } catch { return MOCK_REQUESTS; }
}

function saveRequests(r: AccessRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
}

const TAB_LABELS: Record<RequestStatus | "all", string> = {
  all: "All", pending: "Pending", approved: "Approved", denied: "Denied"
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending:  "bg-yellow-950 text-yellow-400 border-yellow-900",
  approved: "bg-emerald-950 text-emerald-400 border-emerald-900",
  denied:   "bg-red-950 text-red-400 border-red-900",
};

export default function MerchantAccessPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [tab, setTab]           = useState<RequestStatus | "all">("pending");

  useEffect(() => { setRequests(loadRequests()); }, []);

  function update(id: string, status: RequestStatus) {
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(updated);
    saveRequests(updated);
  }

  const filtered = tab === "all" ? requests : requests.filter(r => r.status === tab);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Merchant Access</h1>
        <p className="text-sm text-neutral-400 mt-1">Control which merchants can access your product catalog</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending",  value: requests.filter(r => r.status === "pending").length,  color: "text-yellow-400"  },
          { label: "Approved", value: requests.filter(r => r.status === "approved").length, color: "text-emerald-400" },
          { label: "Denied",   value: requests.filter(r => r.status === "denied").length,   color: "text-red-400"     },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit mb-5">
        {(["all", "pending", "approved", "denied"] as (RequestStatus | "all")[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${tab === t ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
            {TAB_LABELS[t]}{t === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
            No {tab === "all" ? "" : tab} requests.
          </div>
        ) : filtered.map(req => (
          <div key={req.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">{req.merchantName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>
                  <span className="text-xs text-neutral-600">{req.store}</span>
                </div>
                <p className="text-xs text-neutral-500 mb-1">{req.merchantEmail}</p>
                {req.message && (
                  <p className="text-xs text-neutral-400 italic mt-2 bg-neutral-800 rounded-lg px-3 py-2">
                    "{req.message}"
                  </p>
                )}
                <p className="text-xs text-neutral-600 mt-2">
                  Requested {new Date(req.requestedAt).toLocaleDateString()}
                </p>
              </div>

              {req.status === "pending" && (
                <div className="flex gap-2 ml-4 shrink-0">
                  <button onClick={() => update(req.id, "approved")}
                    className="text-xs px-3 py-1.5 rounded-md bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-900 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => update(req.id, "denied")}
                    className="text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 transition-colors">
                    Deny
                  </button>
                </div>
              )}
              {req.status !== "pending" && (
                <button onClick={() => update(req.id, "pending")}
                  className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors ml-4 shrink-0">
                  Reset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
