"use client";

import { useState, useEffect } from "react";

interface AutomationRule {
  id: string;
  name: string;
  trigger: { type: string; value?: number };
  condition: { category?: string; minScore?: number };
  action: { type: string };
  enabled: boolean;
  createdAt: string;
}

const TRIGGER_OPTIONS = [
  { value: "score_drops_below", label: "Opportunity score drops below" },
  { value: "stock_low",         label: "Stock quantity drops below"    },
  { value: "new_product",       label: "New product ingested"          },
  { value: "score_rises_above", label: "Opportunity score rises above" },
];

const ACTION_OPTIONS = [
  { value: "notify",        label: "Send notification"  },
  { value: "sync_shopify",  label: "Sync to Shopify"    },
  { value: "sync_woo",      label: "Sync to WooCommerce"},
  { value: "add_watchlist", label: "Add to watchlist"   },
];

const STORAGE_KEY = "ravro_automations";

function loadRules(): AutomationRule[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveRules(rules: AutomationRule[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); }

const blank = (): Omit<AutomationRule, "id" | "createdAt"> => ({
  name: "", trigger: { type: "score_drops_below", value: 0.5 },
  condition: {}, action: { type: "notify" }, enabled: true,
});

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface3)", border: "1px solid var(--border)",
  borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "var(--text-primary)", outline: "none",
  boxSizing: "border-box",
};

export default function AutomationPage() {
  const [rules, setRules]     = useState<AutomationRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(blank());
  const [editId, setEditId]   = useState<string | null>(null);

  useEffect(() => { setRules(loadRules()); }, []);

  function save() {
    if (!form.name.trim()) return;
    const updated: AutomationRule[] = editId
      ? rules.map(r => r.id === editId ? { ...form, id: editId, createdAt: r.createdAt } : r)
      : [...rules, { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
    setRules(updated); saveRules(updated);
    setShowForm(false); setEditId(null); setForm(blank());
  }

  function toggle(id: string) {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRules(updated); saveRules(updated);
  }

  function remove(id: string) {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated); saveRules(updated);
  }

  function startEdit(r: AutomationRule) {
    setForm({ name: r.name, trigger: r.trigger, condition: r.condition, action: r.action, enabled: r.enabled });
    setEditId(r.id); setShowForm(true);
  }

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5, letterSpacing: 0.3 };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">AUTOMATION</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Automation Builder</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Trigger actions automatically based on product and market signals</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(blank()); }} style={{
          background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4,
          padding: "8px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer",
        }}>+ New Rule</button>
      </div>

      {showForm && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "20px 22px", marginBottom: 18 }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 14 }} className="font-orbitron">
            {editId ? "EDIT RULE" : "NEW RULE"}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Rule name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Alert when score drops" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Trigger</label>
              <select value={form.trigger.type}
                onChange={e => setForm(f => ({ ...f, trigger: { ...f.trigger, type: e.target.value } }))}
                style={inputStyle}>
                {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {["score_drops_below","score_rises_above","stock_low"].includes(form.trigger.type) && (
              <div>
                <label style={labelStyle}>Threshold value</label>
                <input type="number" step="0.01" min="0" max="1"
                  value={form.trigger.value ?? ""}
                  onChange={e => setForm(f => ({ ...f, trigger: { ...f.trigger, value: parseFloat(e.target.value) } }))}
                  style={inputStyle} />
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Filter by category (optional)</label>
              <input value={form.condition.category || ""}
                onChange={e => setForm(f => ({ ...f, condition: { ...f.condition, category: e.target.value } }))}
                placeholder="e.g. Electronics" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Action</label>
              <select value={form.action.type}
                onChange={e => setForm(f => ({ ...f, action: { type: e.target.value } }))}
                style={inputStyle}>
                {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={{
              background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4,
              padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>{editId ? "Save changes" : "Create rule"}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{
              background: "none", border: "none", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer", padding: "8px 12px",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {rules.length === 0 && !showForm ? (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>No automation rules yet.</p>
          <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>Create your first rule to automate actions on product signals.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rules.map(r => (
            <div key={r.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</span>
                  <span style={{
                    fontSize: 8, padding: "2px 6px", borderRadius: 2, letterSpacing: 0.5,
                    background: r.enabled ? "rgba(0,245,196,0.08)" : "var(--surface3)",
                    color: r.enabled ? "var(--mint)" : "var(--text-dim)",
                    border: `1px solid ${r.enabled ? "var(--border-mint)" : "var(--border)"}`,
                  }}>{r.enabled ? "Active" : "Paused"}</span>
                </div>
                <p style={{ fontSize: 10, color: "var(--text-dim)" }}>
                  {TRIGGER_OPTIONS.find(o => o.value === r.trigger.type)?.label}
                  {r.trigger.value != null ? ` ${r.trigger.value}` : ""}
                  {r.condition.category ? ` · ${r.condition.category}` : ""}
                  {" → "}
                  {ACTION_OPTIONS.find(o => o.value === r.action.type)?.label}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 16 }}>
                {[
                  { label: r.enabled ? "Pause" : "Resume", onClick: () => toggle(r.id), danger: false },
                  { label: "Edit", onClick: () => startEdit(r), danger: false },
                  { label: "Delete", onClick: () => remove(r.id), danger: true },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.onClick} style={{
                    fontSize: 10, padding: "5px 10px", borderRadius: 4, cursor: "pointer",
                    background: btn.danger ? "rgba(255,75,110,0.08)" : "var(--surface3)",
                    color: btn.danger ? "var(--red)" : "var(--text-secondary)",
                    border: `1px solid ${btn.danger ? "rgba(255,75,110,0.25)" : "var(--border)"}`,
                  }}>{btn.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
