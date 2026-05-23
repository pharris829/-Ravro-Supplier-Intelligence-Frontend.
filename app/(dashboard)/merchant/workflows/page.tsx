"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  getWorkflowEvents, getRetryQueue, getWorkflowErrors, retryWorkflowEvent,
  retryAllEvents, triggerWorkflowEvent,
  type Workflow, type WorkflowEvent, type WorkflowError,
} from "@/lib/api";

const TRIGGER_OPTIONS = [
  { value: "score_below",     label: "Opportunity score drops below",  hasThreshold: true  },
  { value: "score_above",     label: "Opportunity score rises above",  hasThreshold: true  },
  { value: "new_product",     label: "New product ingested",           hasThreshold: false },
  { value: "stock_low",       label: "Stock quantity drops below",     hasThreshold: true  },
  { value: "ingest_complete", label: "CSV batch completes",            hasThreshold: false },
  { value: "supplier_added",  label: "New supplier registered",        hasThreshold: false },
  { value: "manual",          label: "Manual trigger only",            hasThreshold: false },
];

const ACTION_OPTIONS = [
  { value: "notify",           label: "Send in-app notification", configFields: ["message"]      },
  { value: "sync_shopify",     label: "Sync to Shopify",          configFields: ["store_url"]    },
  { value: "sync_woocommerce", label: "Sync to WooCommerce",      configFields: ["store_url"]    },
  { value: "webhook",          label: "Call webhook URL",          configFields: ["url"]          },
  { value: "mark_watchlist",   label: "Add to watchlist",          configFields: []               },
  { value: "email",            label: "Send email",                configFields: ["to","subject"] },
];

type Tab = "rules" | "events" | "retry" | "errors";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface3)", border: "1px solid var(--border)",
  borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "var(--text-primary)",
  outline: "none", boxSizing: "border-box",
};

function statusColor(s: string): string {
  return s === "success" ? "var(--mint)" : s === "failed" ? "var(--red)" : s === "retrying" ? "var(--amber)" : s === "running" ? "var(--blue)" : "var(--text-dim)";
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  return <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 2, background: `${color}10`, color, border: `1px solid ${color}40`, textTransform: "capitalize", letterSpacing: 0.5 }}>{status}</span>;
}

function RelativeTime({ iso }: { iso?: string }) {
  if (!iso) return <span style={{ color: "var(--text-dim)", fontSize: 10 }}>—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000), hrs = Math.floor(mins / 60), days = Math.floor(hrs / 24);
  const label = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins > 0 ? `${mins}m ago` : "just now";
  return <span style={{ fontSize: 10, color: "var(--text-dim)" }} title={new Date(iso).toLocaleString()}>{label}</span>;
}

const STEPS = ["Name", "Trigger", "Condition", "Action"];

function RuleBuilder({ onSave, onCancel, initial }: { onSave: (d: Partial<Workflow>) => void; onCancel: () => void; initial?: Partial<Workflow> }) {
  const [step,        setStep]        = useState(0);
  const [name,        setName]        = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [triggerType, setTriggerType] = useState(initial?.trigger_type ?? "score_below");
  const [threshold,   setThreshold]   = useState((initial?.trigger_config as { threshold?: number })?.threshold?.toString() ?? "0.50");
  const [condCat,     setCondCat]     = useState((initial?.condition_config as { category?: string })?.category ?? "");
  const [actionType,  setActionType]  = useState(initial?.action_type ?? "notify");
  const [actionCfg,   setActionCfg]   = useState<Record<string, string>>((initial?.action_config as Record<string, string>) ?? {});

  const triggerMeta = TRIGGER_OPTIONS.find(t => t.value === triggerType);
  const actionMeta  = ACTION_OPTIONS.find(a => a.value === actionType);

  function buildAndSave() {
    const trigCfg: Record<string, unknown> = {};
    if (triggerMeta?.hasThreshold && threshold) trigCfg.threshold = parseFloat(threshold);
    const condCfg: Record<string, unknown> = {};
    if (condCat) condCfg.category = condCat;
    onSave({ name, description, trigger_type: triggerType, trigger_config: trigCfg, condition_config: condCfg, action_type: actionType, action_config: actionCfg, enabled: true });
  }

  return (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "20px 22px", marginBottom: 14 }}>
      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => i < step && setStep(i)} style={{
              width: 24, height: 24, borderRadius: "50%", fontSize: 10, fontWeight: 700, border: "none", cursor: i < step ? "pointer" : "default",
              background: i === step ? "var(--mint)" : i < step ? "rgba(0,245,196,0.3)" : "var(--surface3)",
              color: i === step ? "var(--obsidian)" : i < step ? "var(--mint)" : "var(--text-dim)",
            }}>{i < step ? "✓" : i + 1}</button>
            <span style={{ fontSize: 10, color: i === step ? "var(--text-primary)" : "var(--text-dim)" }}>{s}</span>
            {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: i < step ? "rgba(0,245,196,0.4)" : "var(--border)" }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5 }}>Rule Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alert when score drops" style={inputStyle} /></div>
          <div><label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5 }}>Description (optional)</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this rule do?" style={inputStyle} /></div>
        </div>
      )}

      {step === 1 && (
        <div>
          <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 8 }}>When this happens…</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: triggerMeta?.hasThreshold ? 14 : 0 }}>
            {TRIGGER_OPTIONS.map(t => (
              <label key={t.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 4, border: `1px solid ${triggerType === t.value ? "var(--border-mint)" : "var(--border)"}`, background: triggerType === t.value ? "rgba(0,245,196,0.04)" : "transparent", cursor: "pointer" }}>
                <input type="radio" name="trigger" value={t.value} checked={triggerType === t.value} onChange={() => setTriggerType(t.value)} style={{ accentColor: "var(--mint)" }} />
                <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{t.label}</span>
              </label>
            ))}
          </div>
          {triggerMeta?.hasThreshold && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5 }}>Threshold value</label>
              <input type="number" step="0.01" min="0" max="1" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ ...inputStyle, width: 120 }} />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <p style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 12 }}>Optionally narrow which products this rule applies to.</p>
          <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5 }}>Filter by category (leave blank for all)</label>
          <input value={condCat} onChange={e => setCondCat(e.target.value)} placeholder="e.g. Electronics" style={inputStyle} />
        </div>
      )}

      {step === 3 && (
        <div>
          <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 8 }}>Then do this…</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: (actionMeta?.configFields.length ?? 0) > 0 ? 14 : 0 }}>
            {ACTION_OPTIONS.map(a => (
              <label key={a.value} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 4, border: `1px solid ${actionType === a.value ? "var(--border-mint)" : "var(--border)"}`, background: actionType === a.value ? "rgba(0,245,196,0.04)" : "transparent", cursor: "pointer" }}>
                <input type="radio" name="action" value={a.value} checked={actionType === a.value} onChange={() => setActionType(a.value)} style={{ accentColor: "var(--mint)" }} />
                <span style={{ fontSize: 10, color: "var(--text-primary)" }}>{a.label}</span>
              </label>
            ))}
          </div>
          {(actionMeta?.configFields ?? []).map(field => (
            <div key={field} style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5, textTransform: "capitalize" }}>{field.replace("_", " ")}</label>
              <input value={actionCfg[field] ?? ""} onChange={e => setActionCfg(p => ({ ...p, [field]: e.target.value }))}
                placeholder={field === "url" ? "https://…" : field === "to" ? "email@example.com" : ""} style={inputStyle} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !name.trim()} style={{ background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4, padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: step === 0 && !name.trim() ? 0.5 : 1 }}>Next →</button>
        ) : (
          <button onClick={buildAndSave} disabled={!name.trim()} style={{ background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4, padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: !name.trim() ? 0.5 : 1 }}>
            {initial ? "Save changes" : "Create rule"}
          </button>
        )}
        {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer", padding: "8px 12px" }}>← Back</button>}
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 11, cursor: "pointer", padding: "8px 12px", marginLeft: "auto" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const [tab,         setTab]         = useState<Tab>("rules");
  const [workflows,   setWFs]         = useState<Workflow[]>([]);
  const [events,      setEvents]      = useState<WorkflowEvent[]>([]);
  const [retryQ,      setRetryQ]      = useState<WorkflowEvent[]>([]);
  const [errors,      setErrors]      = useState<WorkflowError[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editWf,      setEditWf]      = useState<Workflow | null>(null);
  const [retrying,    setRetrying]    = useState<string | null>(null);
  const [toggling,    setToggling]    = useState<string | null>(null);
  const [evtFilter,   setEvtFilter]   = useState("all");
  const [detailEvent, setDetailEvent] = useState<WorkflowEvent | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [wfs, evts, rq, errs] = await Promise.allSettled([getWorkflows(), getWorkflowEvents(), getRetryQueue(), getWorkflowErrors()]);
    if (wfs.status  === "fulfilled") setWFs(wfs.value.workflows);
    if (evts.status === "fulfilled") setEvents(evts.value.events);
    if (rq.status   === "fulfilled") setRetryQ(rq.value.events);
    if (errs.status === "fulfilled") setErrors(errs.value.errors);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleCreate(data: Partial<Workflow>) { await createWorkflow(data); setShowBuilder(false); loadAll(); }
  async function handleEdit(data: Partial<Workflow>) { if (!editWf) return; await updateWorkflow(editWf.id, data); setEditWf(null); loadAll(); }
  async function handleDelete(id: string) { if (!confirm("Delete this workflow?")) return; await deleteWorkflow(id); loadAll(); }
  async function handleToggle(wf: Workflow) { setToggling(wf.id); await updateWorkflow(wf.id, { enabled: !wf.enabled }); setToggling(null); loadAll(); }
  async function handleRetry(id: string) { setRetrying(id); await retryWorkflowEvent(id); setRetrying(null); loadAll(); }
  async function handleRetryAll() { setRetrying("all"); await retryAllEvents(); setRetrying(""); loadAll(); }
  async function handleTest(type: string) { await triggerWorkflowEvent(type, { product: "Test Product", score: 0.45, category: "Electronics" }); loadAll(); }

  const filteredEvents = evtFilter === "all" ? events : events.filter(e => e.status === evtFilter);
  const trigLabel = (t: string) => TRIGGER_OPTIONS.find(x => x.value === t)?.label ?? t;
  const actLabel  = (a: string) => ACTION_OPTIONS.find(x => x.value === a)?.label  ?? a;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "rules",  label: "Rules",         badge: workflows.length          },
    { key: "events", label: "Event Log",     badge: events.length             },
    { key: "retry",  label: "Retry Queue",   badge: retryQ.length || undefined },
    { key: "errors", label: "Error Surface", badge: errors.length || undefined },
  ];

  const btnStyle = (variant: "primary" | "secondary" | "danger" | "warn"): React.CSSProperties => ({
    fontSize: 10, padding: "5px 10px", borderRadius: 4, cursor: "pointer", border: "none",
    background: variant === "primary" ? "var(--mint)" : variant === "danger" ? "rgba(255,75,110,0.08)" : variant === "warn" ? "rgba(255,184,77,0.1)" : "var(--surface3)",
    color: variant === "primary" ? "var(--obsidian)" : variant === "danger" ? "var(--red)" : variant === "warn" ? "var(--amber)" : "var(--text-secondary)",
    ...(variant === "danger" ? { border: "1px solid rgba(255,75,110,0.25)" } : {}),
    ...(variant === "warn"   ? { border: "1px solid rgba(255,184,77,0.3)" } : {}),
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">MERCHANT</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Workflow Automation</h1>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Event-driven rules that act on product and market signals</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadAll} style={btnStyle("secondary")}>↻ Refresh</button>
          {tab === "rules" && <button onClick={() => { setShowBuilder(true); setEditWf(null); }} style={{ ...btnStyle("primary"), padding: "7px 16px", fontWeight: 600, fontSize: 11 }}>+ New Rule</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 0", borderRadius: 3, fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer",
            background: tab === t.key ? "var(--mint)" : "transparent",
            color: tab === t.key ? "var(--obsidian)" : "var(--text-secondary)",
          }}>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 9, background: tab === t.key ? "rgba(0,0,0,0.2)" : (t.key === "retry" || t.key === "errors") ? "rgba(255,75,110,0.15)" : "var(--surface3)", color: tab === t.key ? "var(--obsidian)" : (t.key === "retry" || t.key === "errors") ? "var(--red)" : "var(--text-dim)" }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(3)].map((_, i) => <div key={i} style={{ height: 56, borderRadius: 4, background: "var(--surface2)", border: "1px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />)}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      ) : (
        <>
          {/* RULES */}
          {tab === "rules" && (
            <div>
              {showBuilder && !editWf && <RuleBuilder onSave={handleCreate} onCancel={() => setShowBuilder(false)} />}
              {editWf && <RuleBuilder initial={editWf} onSave={handleEdit} onCancel={() => setEditWf(null)} />}
              {workflows.length === 0 && !showBuilder ? (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "40px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>No workflow rules yet.</p>
                  <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "4px 0 0" }}>Create your first rule to automate actions on product signals.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {workflows.map(wf => (
                    <div key={wf.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wf.name}</p>
                            <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 2, flexShrink: 0, background: wf.enabled ? "rgba(0,245,196,0.08)" : "var(--surface3)", color: wf.enabled ? "var(--mint)" : "var(--text-dim)", border: `1px solid ${wf.enabled ? "var(--border-mint)" : "var(--border)"}` }}>{wf.enabled ? "Active" : "Paused"}</span>
                            {(wf.error_count ?? 0) > 0 && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 2, background: "rgba(255,75,110,0.08)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.25)", flexShrink: 0 }}>{wf.error_count} errors</span>}
                          </div>
                          {wf.description && <p style={{ fontSize: 9, color: "var(--text-secondary)", margin: "0 0 4px" }}>{wf.description}</p>}
                          <p style={{ fontSize: 10, color: "var(--text-dim)", margin: 0 }}>
                            <span style={{ color: "var(--text-secondary)" }}>{trigLabel(wf.trigger_type)}</span>
                            {(wf.trigger_config as { threshold?: number })?.threshold != null && ` ${(wf.trigger_config as { threshold?: number }).threshold}`}
                            {(wf.condition_config as { category?: string })?.category && ` · ${(wf.condition_config as { category?: string }).category}`}
                            <span style={{ color: "var(--mint)" }}> → {actLabel(wf.action_type)}</span>
                          </p>
                          <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 9, color: "var(--text-dim)" }}>
                            <span>Runs: <span style={{ color: "var(--text-secondary)" }}>{wf.run_count}</span></span>
                            <span>Last run: <RelativeTime iso={wf.last_run_at} /></span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => handleToggle(wf)} disabled={toggling === wf.id} style={{ ...btnStyle("secondary"), opacity: toggling === wf.id ? 0.5 : 1 }}>{toggling === wf.id ? "…" : wf.enabled ? "Pause" : "Resume"}</button>
                          <button onClick={() => { setEditWf(wf); setShowBuilder(false); }} style={btnStyle("secondary")}>Edit</button>
                          <button onClick={() => handleTest(wf.trigger_type)} style={{ ...btnStyle("secondary"), color: "var(--mint)", border: "1px solid var(--border-mint)", background: "rgba(0,245,196,0.05)" }}>Test</button>
                          <button onClick={() => handleDelete(wf.id)} style={btnStyle("danger")}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EVENT LOG */}
          {tab === "events" && (
            <div>
              <div style={{ display: "flex", gap: 4, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: 4, width: "fit-content", marginBottom: 14 }}>
                {["all","success","failed","retrying","running"].map(s => (
                  <button key={s} onClick={() => setEvtFilter(s)} style={{ padding: "4px 10px", borderRadius: 3, fontSize: 10, border: "none", cursor: "pointer", textTransform: "capitalize", background: evtFilter === s ? "var(--mint)" : "transparent", color: evtFilter === s ? "var(--obsidian)" : "var(--text-secondary)" }}>{s}</button>
                ))}
              </div>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Time","Workflow","Trigger","Action","Status","Duration",""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 8, letterSpacing: 1, color: "var(--text-dim)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: "28px", textAlign: "center", fontSize: 11, color: "var(--text-dim)" }}>No events</td></tr>
                    ) : filteredEvents.map(ev => (
                      <tr key={ev.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 14px" }}><RelativeTime iso={ev.created_at} /></td>
                        <td style={{ padding: "10px 14px", fontSize: 10, fontWeight: 600, color: "var(--text-primary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.workflow_name}</td>
                        <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{trigLabel(ev.trigger_type)}</td>
                        <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-secondary)" }}>{actLabel(ev.action_type)}</td>
                        <td style={{ padding: "10px 14px" }}><StatusBadge status={ev.status} /></td>
                        <td style={{ padding: "10px 14px", fontSize: 10, color: "var(--text-dim)" }}>{ev.duration_ms != null ? `${ev.duration_ms}ms` : "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => setDetailEvent(detailEvent?.id === ev.id ? null : ev)} style={{ fontSize: 10, color: "var(--mint)", background: "none", border: "none", cursor: "pointer" }}>
                            {detailEvent?.id === ev.id ? "▲" : "▼"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detailEvent && (
                <div style={{ marginTop: 10, background: "var(--surface2)", border: "1px solid var(--border-mint)", borderRadius: 4, padding: "16px 18px", fontFamily: "monospace" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                    {[{ label: "Trigger Data", data: detailEvent.trigger_data, ok: true }, { label: "Result / Error", data: detailEvent.error ?? detailEvent.result ?? {}, ok: !detailEvent.error }].map(({ label, data, ok }) => (
                      <div key={label}>
                        <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 5 }}>{label}</p>
                        <pre style={{ fontSize: 9, color: ok ? "var(--mint)" : "var(--red)", background: ok ? "rgba(0,245,196,0.05)" : "rgba(255,75,110,0.05)", borderRadius: 4, padding: "8px 10px", margin: 0, overflow: "auto" }}>
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 9, color: "var(--text-dim)", margin: 0 }}>Attempts: {detailEvent.attempts} / {detailEvent.max_attempts} · ID: {detailEvent.id}</p>
                </div>
              )}
            </div>
          )}

          {/* RETRY QUEUE */}
          {tab === "retry" && (
            <div>
              {retryQ.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button onClick={handleRetryAll} disabled={retrying === "all"} style={{ ...btnStyle("warn"), padding: "7px 16px", opacity: retrying === "all" ? 0.6 : 1 }}>
                    {retrying === "all" ? "Retrying all…" : `↺ Retry All (${retryQ.length})`}
                  </button>
                </div>
              )}
              {retryQ.length === 0 ? (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--mint)", margin: 0 }}>✓ No events in the retry queue</p>
                  <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "4px 0 0" }}>All workflows are running cleanly.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {retryQ.map(ev => (
                    <div key={ev.id} style={{ background: "var(--surface2)", border: "1px solid rgba(255,184,77,0.25)", borderRadius: 4, padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{ev.workflow_name}</p>
                            <StatusBadge status={ev.status} />
                          </div>
                          <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "0 0 8px" }}>{trigLabel(ev.trigger_type)} → {actLabel(ev.action_type)}</p>
                          <div style={{ fontSize: 10, color: "var(--red)", background: "rgba(255,75,110,0.05)", border: "1px solid rgba(255,75,110,0.2)", borderRadius: 4, padding: "5px 8px", marginBottom: 6 }}>{ev.error ?? "Unknown error"}</div>
                          <div style={{ display: "flex", gap: 14, fontSize: 9, color: "var(--text-dim)" }}>
                            <span>Attempts: <span style={{ color: "var(--amber)" }}>{ev.attempts} / {ev.max_attempts}</span></span>
                            <span>Failed: <RelativeTime iso={ev.updated_at} /></span>
                          </div>
                        </div>
                        <button onClick={() => handleRetry(ev.id)} disabled={retrying === ev.id} style={{ ...btnStyle("warn"), marginLeft: 14, flexShrink: 0, opacity: retrying === ev.id ? 0.5 : 1 }}>
                          {retrying === ev.id ? "…" : "↺ Retry"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ERROR SURFACE */}
          {tab === "errors" && (
            <div>
              {errors.length === 0 ? (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 11, color: "var(--mint)", margin: 0 }}>✓ No errors detected</p>
                  <p style={{ fontSize: 10, color: "var(--text-dim)", margin: "4px 0 0" }}>All workflow executions are healthy.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {errors.map((e, i) => {
                    const hint = e.error.includes("rate limit") ? "Add a delay between syncs or upgrade your plan."
                      : e.error.includes("timeout") ? "Check the service URL and your network connectivity."
                      : e.error.includes("unavailable") ? "The target service is down. Check its status page."
                      : e.error.includes("not configured") ? "Add the required configuration to the workflow action."
                      : "Check the action configuration and retry.";
                    return (
                      <div key={i} style={{ background: "var(--surface2)", border: "1px solid rgba(255,75,110,0.25)", borderRadius: 4, padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ flex: 1, paddingRight: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: "rgba(255,75,110,0.1)", color: "var(--red)", border: "1px solid rgba(255,75,110,0.3)", fontWeight: 700 }}>×{e.count}</span>
                              {e.retrying_count > 0 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: "rgba(255,184,77,0.1)", color: "var(--amber)", border: "1px solid rgba(255,184,77,0.3)" }}>{e.retrying_count} retrying</span>}
                            </div>
                            <p style={{ fontSize: 11, fontFamily: "monospace", color: "var(--red)", margin: 0 }}>{e.error}</p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, fontSize: 9, color: "var(--text-dim)" }}>
                            <p style={{ margin: 0 }}>Last seen</p>
                            <RelativeTime iso={e.last_seen} />
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {e.affected_workflows.map(wf => <span key={wf} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: "var(--surface3)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>{wf}</span>)}
                          {e.action_types.map(at => <span key={at} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: "rgba(0,245,196,0.06)", color: "var(--mint)", border: "1px solid var(--border-mint)" }}>{actLabel(at)}</span>)}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--amber)", background: "rgba(255,184,77,0.05)", border: "1px solid rgba(255,184,77,0.2)", borderRadius: 4, padding: "6px 10px" }}>
                          💡 {hint}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
