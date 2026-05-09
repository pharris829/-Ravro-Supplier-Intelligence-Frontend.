"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, register } from "@/lib/api";

type Mode = "login" | "register";
const ROLES = ["merchant", "supplier"] as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]         = useState<Mode>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [role, setRole]         = useState<"merchant" | "supplier">("merchant");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else                  await register(email, password, role, name);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally { setLoading(false); }
  }

  const input = {
    style: {
      width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: 2, padding: "10px 14px", fontSize: 13,
      color: "var(--text-primary)", outline: "none", fontFamily: "'Space Grotesk',sans-serif",
    } as React.CSSProperties,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "var(--border-mint)"; },
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "var(--border)"; },
  };

  return (
    <div className="grid-bg" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--obsidian)", position: "relative",
    }}>
      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-orbitron" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: "var(--silver-bright)" }}>
              RAVRO
            </span>
          </Link>
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--text-secondary)", letterSpacing: 1 }}>
            {mode === "login" ? "Sign in to your workspace" : "Create your account"}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 2, padding: 2, marginBottom: 20,
        }}>
          {(["login", "register"] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setError(""); }}
              className="font-grotesk" style={{
                flex: 1, padding: "8px 0", fontSize: 10, letterSpacing: 2,
                textTransform: "uppercase", fontWeight: 600, border: "none", borderRadius: 2,
                cursor: "pointer", transition: "all 0.2s",
                background: mode === m ? "var(--mint)" : "transparent",
                color:      mode === m ? "var(--obsidian)" : "var(--text-secondary)",
              }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="card-mint-edge" style={{
          position: "relative", background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 4, padding: "28px 28px 24px",
        }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 14px", fontSize: 12, borderRadius: 2,
              background: "rgba(255,75,110,0.08)", border: "1px solid rgba(255,75,110,0.3)", color: "var(--red)",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: 9, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 7 }} className="font-orbitron">
                  Name
                </label>
                <input {...input} type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name or company" />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 9, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 7 }} className="font-orbitron">
                Email
              </label>
              <input {...input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 9, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 7 }} className="font-orbitron">
                Password
              </label>
              <input {...input} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" />
            </div>

            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: 9, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 10 }} className="font-orbitron">
                  Role
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {ROLES.map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className="font-grotesk" style={{
                        flex: 1, padding: "9px 0", fontSize: 10, letterSpacing: 2,
                        textTransform: "uppercase", fontWeight: 600, borderRadius: 2,
                        cursor: "pointer", transition: "all 0.2s", border: "1px solid",
                        borderColor: role === r ? "var(--mint)" : "var(--border)",
                        background:  role === r ? "rgba(0,245,196,0.08)" : "transparent",
                        color:       role === r ? "var(--mint)" : "var(--text-secondary)",
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>
                  {role === "merchant" ? "Browse and evaluate supplier products." : "List your products and manage your catalog."}
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="font-grotesk" style={{
              marginTop: 4, padding: "12px 0", fontSize: 11, letterSpacing: 2.5,
              textTransform: "uppercase", fontWeight: 700, borderRadius: 2,
              cursor: loading ? "default" : "pointer", border: "none", transition: "opacity 0.2s",
              background: "var(--mint)", color: "var(--obsidian)",
              opacity: loading ? 0.6 : 1,
            }}>
              {loading
                ? (mode === "login" ? "Authenticating…" : "Creating account…")
                : (mode === "login" ? "Initialize Session" : "Create Account")}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "var(--text-dim)", letterSpacing: 1 }}>
          <Link href="/" style={{ color: "var(--text-dim)", textDecoration: "none" }}>← Back to Ravro</Link>
        </p>
      </div>
    </div>
  );
}
