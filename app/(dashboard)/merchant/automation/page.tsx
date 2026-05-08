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
  { value: "stock_low",         label: "Stock quantity drops below" },
  { value: "new_product",       label: "New product ingested" },
  { value: "score_rises_above", label: "Opportunity score rises above" },
];

const ACTION_OPTIONS = [
  { value: "notify",        label: "Send notification" },
  { value: "sync_shopify",  label: "Sync to Shopify" },
  { value: "sync_woo",      label: "Sync to WooCommerce" },
  { value: "add_watchlist", label: "Add to watchlist" },
];

const STORAGE_KEY = "ravro_automations";

function loadRules(): AutomationRule[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveRules(rules: AutomationRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

const blank = (): Omit<AutomationRule, "id" | "createdAt"> => ({
  name: "",
  trigger: { type: "score_drops_below", value: 0.5 },
  condition: {},
  action: { type: "notify" },
  enabled: true,
});

export default function AutomationPage() {
  const [rules, setRules]     = useState<AutomationRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(blank());
  const [editId, setEditId]   = useState<string | null>(null);

  useEffect(() => { setRules(loadRules()); }, []);

  function save() {
    if (!form.name.trim()) return;
    let updated: AutomationRule[];
    if (editId) {
      updated = rules.map(r => r.id === editId ? { ...form, id: editId, createdAt: r.createdAt } : r);
    } else {
      updated = [...rules, { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
    }
    setRules(updated);
    saveRules(updated);
    setShowForm(false);
    setEditId(null);
    setForm(blank());
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
    setEditId(r.id);
    setShowForm(true);
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Automation Builder</h1>
          <p className="text-sm text-neutral-400 mt-1">Trigger actions automatically based on product and market signals</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(blank()); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Rule
        </button>
      </div>

      {/* Rule form */}
      {showForm && (
        <div className="bg-neutral-900 border border-indigo-800 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">{editId ? "Edit Rule" : "New Automation Rule"}</h2>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Rule name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Alert when score drops"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Trigger</label>
              <select value={form.trigger.type}
                onChange={e => setForm(f => ({ ...f, trigger: { ...f.trigger, type: e.target.value } }))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {["score_drops_below","score_rises_above","stock_low"].includes(form.trigger.type) && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Threshold value</label>
                <input type="number" step="0.01" min="0" max="1"
                  value={form.trigger.value ?? ""}
                  onChange={e => setForm(f => ({ ...f, trigger: { ...f.trigger, value: parseFloat(e.target.value) } }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Filter by category (optional)</label>
              <input value={form.condition.category || ""}
                onChange={e => setForm(f => ({ ...f, condition: { ...f.condition, category: e.target.value } }))}
                placeholder="e.g. Electronics"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Action</label>
              <select value={form.action.type}
                onChange={e => setForm(f => ({ ...f, action: { type: e.target.value } }))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={save}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              {editId ? "Save changes" : "Create rule"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="text-sm text-neutral-400 hover:text-white px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !showForm ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
          <p className="text-neutral-400 text-sm">No automation rules yet.</p>
          <p className="text-neutral-600 text-xs mt-1">Create your first rule to automate actions on product signals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => (
            <div key={r.id} className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{r.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${r.enabled ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-neutral-800 text-neutral-500 border-neutral-700"}`}>
                    {r.enabled ? "Active" : "Paused"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {TRIGGER_OPTIONS.find(o => o.value === r.trigger.type)?.label}
                  {r.trigger.value != null ? ` ${r.trigger.value}` : ""}
                  {r.condition.category ? ` · ${r.condition.category}` : ""}
                  {" → "}
                  {ACTION_OPTIONS.find(o => o.value === r.action.type)?.label}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => toggle(r.id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                  {r.enabled ? "Pause" : "Resume"}
                </button>
                <button onClick={() => startEdit(r)}
                  className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                  Edit
                </button>
                <button onClick={() => remove(r.id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
