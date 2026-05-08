"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, getApiKeys, getSessions } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export default function SettingsPage() {
  const user = getCurrentUser();
  const [perms,   setPerms]   = useState<{ resource: string; action: string }[]>([]);
  const [keyCount, setKeyCount] = useState<number | null>(null);
  const [sessCount, setSessCount] = useState<number | null>(null);

  useEffect(() => {
    getMe().then(r => setPerms(r.permissions)).catch(() => {});
    getApiKeys().then(r => setKeyCount(r.api_keys.filter(k => !k.revoked).length)).catch(() => {});
    getSessions().then(r => setSessCount(r.sessions.filter(s => !s.revoked).length)).catch(() => {});
  }, []);

  const sections = [
    { href: "/settings/api-keys", title: "API Keys",        desc: "Generate keys for programmatic access to the Ravro API.", stat: keyCount != null ? `${keyCount} active key${keyCount !== 1 ? "s" : ""}` : null },
    { href: "/settings/oauth",    title: "OAuth Apps",       desc: "Register OAuth applications that can request access to your account.", stat: null },
    { href: "/settings/sessions", title: "Active Sessions",  desc: "View and revoke your current login sessions.", stat: sessCount != null ? `${sessCount} session${sessCount !== 1 ? "s" : ""}` : null },
  ];

  const grouped = perms.reduce<Record<string, string[]>>((acc, p) => {
    (acc[p.resource] = acc[p.resource] || []).push(p.action);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">Account security, API access, and permissions</p>
      </div>

      {/* Profile card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold text-sm">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{user?.email}</p>
          <p className="text-xs text-neutral-500 mt-0.5 capitalize">{user?.role} account</p>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {sections.map(s => (
          <Link key={s.href} href={s.href}
            className="bg-neutral-900 border border-neutral-800 hover:border-indigo-600 rounded-xl p-5 flex items-center justify-between transition-colors group">
            <div>
              <h2 className="text-sm font-semibold text-white group-hover:text-indigo-400 mb-0.5">{s.title}</h2>
              <p className="text-xs text-neutral-500">{s.desc}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              {s.stat && <p className="text-xs text-neutral-400">{s.stat}</p>}
              <p className="text-xs text-indigo-500 group-hover:text-indigo-400 mt-0.5">Manage →</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Permissions summary */}
      {perms.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Your Permissions</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(grouped).map(([resource, actions]) => (
              <div key={resource} className="flex items-center justify-between bg-neutral-800 rounded-lg px-3 py-2">
                <span className="text-xs text-neutral-400 capitalize">{resource}</span>
                <div className="flex gap-1">
                  {actions.map(a => (
                    <span key={a} className="text-xs px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-900 capitalize">{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
