"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  getWorkflowEvents, getRetryQueue, getWorkflowErrors, retryWorkflowEvent,
  retryAllEvents, triggerWorkflowEvent,
  type Workflow, type WorkflowEvent, type WorkflowError,
} from "@/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const TRIGGER_OPTIONS = [
  { value: "score_below",      label: "Opportunity score drops below",  hasThreshold: true  },
  { value: "score_above",      label: "Opportunity score rises above",  hasThreshold: true  },
  { value: "new_product",      label: "New product ingested",           hasThreshold: false },
  { value: "stock_low",        label: "Stock quantity drops below",     hasThreshold: true  },
  { value: "ingest_complete",  label: "CSV batch completes",            hasThreshold: false },
  { value: "supplier_added",   label: "New supplier registered",        hasThreshold: false },
  { value: "manual",           label: "Manual trigger only",            hasThreshold: false },
];

const ACTION_OPTIONS = [
  { value: "notify",           label: "Send in-app notification",  configFields: ["message"]     },
  { value: "sync_shopify",     label: "Sync to Shopify",           configFields: ["store_url"]   },
  { value: "sync_woocommerce", label: "Sync to WooCommerce",       configFields: ["store_url"]   },
  { value: "webhook",          label: "Call webhook URL",           configFields: ["url"]         },
  { value: "mark_watchlist",   label: "Add to watchlist",           configFields: []              },
  { value: "email",            label: "Send email",                 configFields: ["to","subject"]},
];

const STATUS_STYLES: Record<string, string> = {
  success:   "bg-emerald-950 text-emerald-400 border-emerald-900",
  failed:    "bg-red-950 text-red-400 border-red-900",
  retrying:  "bg-yellow-950 text-yellow-400 border-yellow-900",
  running:   "bg-blue-950 text-blue-400 border-blue-900",
  pending:   "bg-neutral-800 text-neutral-400 border-neutral-700",
  cancelled: "bg-neutral-800 text-neutral-500 border-neutral-700",
};

type Tab = "rules" | "events" | "retry" | "errors";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {status}
    </span>
  );
}

function RelativeTime({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-neutral-600">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const label = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins > 0 ? `${mins}m ago` : "just now";
  return <span className="text-neutral-500 text-xs" title={new Date(iso).toLocaleString()}>{label}</span>;
}

// ─── Rule Builder ─────────────────────────────────────────────────────────────
function RuleBuilder({ onSave, onCancel, initial }: {
  onSave: (data: Partial<Workflow>) => void;
  onCancel: () => void;
  initial?: Partial<Workflow>;
}) {
  const [step, setStep]               = useState(0);
  const [name, setName]               = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [triggerType, setTriggerType] = useState(initial?.trigger_type ?? "score_below");
  const [threshold, setThreshold]     = useState((initial?.trigger_config as { threshold?: number })?.threshold?.toString() ?? "0.50");
  const [condCategory, setCondCat]    = useState((initial?.condition_config as { category?: string })?.category ?? "");
  const [actionType, setActionType]   = useState(initial?.action_type ?? "notify");
  const [actionCfg, setActionCfg]     = useState<Record<string, string>>(
    (initial?.action_config as Record<string, string>) ?? {}
  );

  const triggerMeta   = TRIGGER_OPTIONS.find(t => t.value === triggerType);
  const actionMeta    = ACTION_OPTIONS.find(a => a.value === actionType);

  const STEPS = ["Name", "Trigger", "Condition", "Action"];

  function buildAndSave() {
    const trigCfg: Record<string, unknown> = {};
    if (triggerMeta?.hasThreshold && threshold) trigCfg.threshold = parseFloat(threshold);

    const condCfg: Record<string, unknown> = {};
    if (condCategory) condCfg.category = condCategory;

    onSave({ name, description, trigger_type: triggerType, trigger_config: trigCfg, condition_config: condCfg, action_type: actionType, action_config: actionCfg, enabled: true });
  }

  return (
    <div className="bg-neutral-900 border border-indigo-800 rounded-xl p-6 mb-5">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button onClick={() => i < step && setStep(i)}
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                i === step ? "bg-indigo-600 text-white" : i < step ? "bg-emerald-700 text-white cursor-pointer" : "bg-neutral-800 text-neutral-600"
              }`}>{i < step ? "✓" : i + 1}</button>
            <span className={`text-xs ${i === step ? "text-white" : "text-neutral-600"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? "bg-emerald-700" : "bg-neutral-800"}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Name */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Rule Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alert when score drops"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Description (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this rule do?"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      )}

      {/* Step 1: Trigger */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-2">When this happens…</label>
            <div className="space-y-2">
              {TRIGGER_OPTIONS.map(t => (
                <label key={t.value} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  triggerType === t.value ? "border-indigo-600 bg-indigo-950/30" : "border-neutral-700 hover:border-neutral-600"
                }`}>
                  <input type="radio" name="trigger" value={t.value} checked={triggerType === t.value}
                    onChange={() => setTriggerType(t.value)} className="accent-indigo-500" />
                  <span className="text-sm text-white">{t.label}</span>
                </label>
              ))}
            </div>
          </div>
          {triggerMeta?.hasThreshold && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Threshold value</label>
              <input type="number" step="0.01" min="0" max="1" value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="w-32 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Condition */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">Optionally narrow which products this rule applies to.</p>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Filter by category (leave blank for all)</label>
            <input value={condCategory} onChange={e => setCondCat(e.target.value)}
              placeholder="e.g. Electronics"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      )}

      {/* Step 3: Action */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Then do this…</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_OPTIONS.map(a => (
                <label key={a.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  actionType === a.value ? "border-indigo-600 bg-indigo-950/30" : "border-neutral-700 hover:border-neutral-600"
                }`}>
                  <input type="radio" name="action" value={a.value} checked={actionType === a.value}
                    onChange={() => setActionType(a.value)} className="accent-indigo-500" />
                  <span className="text-xs text-white">{a.label}</span>
                </label>
              ))}
            </div>
          </div>
          {(actionMeta?.configFields ?? []).length > 0 && (
            <div className="space-y-3">
              {actionMeta!.configFields.map(field => (
                <div key={field}>
                  <label className="block text-xs text-neutral-400 mb-1.5 capitalize">{field.replace("_", " ")}</label>
                  <input value={actionCfg[field] ?? ""} onChange={e => setActionCfg(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={field === "url" ? "https://..." : field === "to" ? "email@example.com" : ""}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex gap-3 mt-5 pt-4 border-t border-neutral-800">
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !name.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            Next →
          </button>
        ) : (
          <button onClick={buildAndSave} disabled={!name.trim()}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            {initial ? "Save changes" : "Create rule"}
          </button>
        )}
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="text-sm text-neutral-400 hover:text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">
            ← Back
          </button>
        )}
        <button onClick={onCancel}
          className="ml-auto text-sm text-neutral-600 hover:text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const [tab, setTab]         = useState<Tab>("rules");
  const [workflows, setWFs]   = useState<Workflow[]>([]);
  const [events, setEvents]   = useState<WorkflowEvent[]>([]);
  const [retryQ, setRetryQ]   = useState<WorkflowEvent[]>([]);
  const [errors, setErrors]   = useState<WorkflowError[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editWf, setEditWf]   = useState<Workflow | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [evtFilter, setEvtFilter] = useState<string>("all");
  const [detailEvent, setDetailEvent] = useState<WorkflowEvent | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [wfs, evts, rq, errs] = await Promise.allSettled([
      getWorkflows(), getWorkflowEvents(), getRetryQueue(), getWorkflowErrors(),
    ]);
    if (wfs.status  === "fulfilled") setWFs(wfs.value.workflows);
    if (evts.status === "fulfilled") setEvents(evts.value.events);
    if (rq.status   === "fulfilled") setRetryQ(rq.value.events);
    if (errs.status === "fulfilled") setErrors(errs.value.errors);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleCreate(data: Partial<Workflow>) {
    await createWorkflow(data);
    setShowBuilder(false);
    loadAll();
  }

  async function handleEdit(data: Partial<Workflow>) {
    if (!editWf) return;
    await updateWorkflow(editWf.id, data);
    setEditWf(null);
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow? Events will be preserved.")) return;
    await deleteWorkflow(id);
    loadAll();
  }

  async function handleToggle(wf: Workflow) {
    setToggling(wf.id);
    await updateWorkflow(wf.id, { enabled: !wf.enabled });
    setToggling(null);
    loadAll();
  }

  async function handleRetry(eventId: string) {
    setRetrying(eventId);
    await retryWorkflowEvent(eventId);
    setRetrying(null);
    loadAll();
  }

  async function handleRetryAll() {
    setRetrying("all");
    await retryAllEvents();
    setRetrying(null);
    loadAll();
  }

  async function handleTestTrigger(type: string) {
    await triggerWorkflowEvent(type, { product: "Test Product", score: 0.45, category: "Electronics" });
    loadAll();
  }

  const filteredEvents = evtFilter === "all" ? events : events.filter(e => e.status === evtFilter);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "rules",  label: "Rules",        badge: workflows.length   },
    { key: "events", label: "Event Log",    badge: events.length      },
    { key: "retry",  label: "Retry Queue",  badge: retryQ.length || undefined },
    { key: "errors", label: "Error Surface",badge: errors.length || undefined },
  ];

  const triggerLabel = (t: string) => TRIGGER_OPTIONS.find(x => x.value === t)?.label ?? t;
  const actionLabel  = (a: string) => ACTION_OPTIONS.find(x => x.value === a)?.label  ?? a;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Workflow Automation</h1>
          <p className="text-sm text-neutral-400 mt-1">Event-driven rules that act on product and market signals</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll}
            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
            ↻ Refresh
          </button>
          {tab === "rules" && (
            <button onClick={() => { setShowBuilder(true); setEditWf(null); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + New Rule
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"
            }`}>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-indigo-500" : (t.key === "retry" || t.key === "errors") ? "bg-red-900 text-red-300" : "bg-neutral-800"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-16 animate-pulse" />)}</div>
      ) : (
        <>
          {/* ─── RULES TAB ─── */}
          {tab === "rules" && (
            <div>
              {(showBuilder && !editWf) && <RuleBuilder onSave={handleCreate} onCancel={() => setShowBuilder(false)} />}
              {editWf && <RuleBuilder initial={editWf} onSave={handleEdit} onCancel={() => setEditWf(null)} />}

              {workflows.length === 0 && !showBuilder ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
                  <p className="text-neutral-400 text-sm">No workflow rules yet.</p>
                  <p className="text-neutral-600 text-xs mt-1">Create your first rule to automate actions on product signals.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows.map(wf => (
                    <div key={wf.id} className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-white truncate">{wf.name}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${wf.enabled ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-neutral-800 text-neutral-500 border-neutral-700"}`}>
                              {wf.enabled ? "Active" : "Paused"}
                            </span>
                            {(wf.error_count ?? 0) > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded border bg-red-950 text-red-400 border-red-900 shrink-0">
                                {wf.error_count} errors
                              </span>
                            )}
                          </div>
                          {wf.description && <p className="text-xs text-neutral-500 mb-2">{wf.description}</p>}
                          <p className="text-xs text-neutral-500">
                            <span className="text-neutral-400">{triggerLabel(wf.trigger_type)}</span>
                            {(wf.trigger_config as { threshold?: number })?.threshold != null &&
                              <span> {(wf.trigger_config as { threshold?: number }).threshold}</span>}
                            {(wf.condition_config as { category?: string })?.category &&
                              <span> · {(wf.condition_config as { category?: string }).category}</span>}
                            <span className="text-indigo-400"> → {actionLabel(wf.action_type)}</span>
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-neutral-600">
                            <span>Runs: <span className="text-neutral-400">{wf.run_count}</span></span>
                            <span>Last run: <RelativeTime iso={wf.last_run_at} /></span>
                            <span>Events: <span className="text-neutral-400">{wf.event_count ?? 0}</span></span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleToggle(wf)} disabled={toggling === wf.id}
                            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 transition-colors">
                            {toggling === wf.id ? "…" : wf.enabled ? "Pause" : "Resume"}
                          </button>
                          <button onClick={() => { setEditWf(wf); setShowBuilder(false); }}
                            className="text-xs px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleTestTrigger(wf.trigger_type)}
                            className="text-xs px-3 py-1.5 rounded-md bg-indigo-950 text-indigo-400 hover:bg-indigo-900 border border-indigo-900 transition-colors">
                            Test
                          </button>
                          <button onClick={() => handleDelete(wf.id)}
                            className="text-xs px-3 py-1.5 rounded-md bg-red-950 text-red-400 hover:bg-red-900 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── EVENT LOG TAB ─── */}
          {tab === "events" && (
            <div>
              <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit mb-4">
                {["all","success","failed","retrying","running"].map(s => (
                  <button key={s} onClick={() => setEvtFilter(s)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${evtFilter === s ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      {["Time","Workflow","Trigger","Action","Status","Duration",""].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-sm">No events</td></tr>
                    ) : filteredEvents.map(ev => (
                      <tr key={ev.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                        <td className="px-4 py-3"><RelativeTime iso={ev.created_at} /></td>
                        <td className="px-4 py-3 text-white text-xs font-medium max-w-32 truncate">{ev.workflow_name}</td>
                        <td className="px-4 py-3 text-neutral-400 text-xs">{triggerLabel(ev.trigger_type)}</td>
                        <td className="px-4 py-3 text-neutral-400 text-xs">{actionLabel(ev.action_type)}</td>
                        <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                        <td className="px-4 py-3 text-neutral-500 text-xs tabular-nums">
                          {ev.duration_ms != null ? `${ev.duration_ms}ms` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setDetailEvent(detailEvent?.id === ev.id ? null : ev)}
                            className="text-xs text-indigo-400 hover:text-indigo-300">
                            {detailEvent?.id === ev.id ? "▲" : "▼"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detail panel */}
              {detailEvent && (
                <div className="mt-4 bg-neutral-900 border border-indigo-900 rounded-xl p-5 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-neutral-500 mb-1">Trigger Data</p>
                      <pre className="text-neutral-300 bg-neutral-800 rounded p-2 overflow-auto">
                        {JSON.stringify(detailEvent.trigger_data, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-neutral-500 mb-1">Result / Error</p>
                      <pre className={`rounded p-2 overflow-auto ${detailEvent.error ? "text-red-400 bg-red-950/30" : "text-emerald-400 bg-emerald-950/30"}`}>
                        {detailEvent.error ?? JSON.stringify(detailEvent.result ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <p className="text-neutral-600">Attempts: {detailEvent.attempts} / {detailEvent.max_attempts} · ID: {detailEvent.id}</p>
                </div>
              )}
            </div>
          )}

          {/* ─── RETRY QUEUE TAB ─── */}
          {tab === "retry" && (
            <div>
              {retryQ.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button onClick={handleRetryAll} disabled={retrying === "all"}
                    className="text-sm px-4 py-2 rounded-lg bg-yellow-900 hover:bg-yellow-800 text-yellow-300 disabled:opacity-50 transition-colors">
                    {retrying === "all" ? "Retrying all…" : `↺ Retry All (${retryQ.length})`}
                  </button>
                </div>
              )}

              {retryQ.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-emerald-400 text-sm">✓ No events in the retry queue</p>
                  <p className="text-neutral-600 text-xs mt-1">All workflows are running cleanly.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {retryQ.map(ev => (
                    <div key={ev.id} className="bg-neutral-900 border border-yellow-900/50 rounded-xl px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{ev.workflow_name}</p>
                            <StatusBadge status={ev.status} />
                          </div>
                          <p className="text-xs text-neutral-500 mb-1">
                            {triggerLabel(ev.trigger_type)} → {actionLabel(ev.action_type)}
                          </p>
                          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded px-2 py-1 mb-2">
                            {ev.error ?? "Unknown error"}
                          </div>
                          <div className="flex gap-4 text-xs text-neutral-600">
                            <span>Attempts: <span className="text-yellow-400">{ev.attempts} / {ev.max_attempts}</span></span>
                            <span>Failed: <RelativeTime iso={ev.updated_at} /></span>
                            {ev.next_retry_at && ev.status === "retrying" && (
                              <span>Next retry: <span className="text-yellow-400">{new Date(ev.next_retry_at).toLocaleTimeString()}</span></span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          <button onClick={() => handleRetry(ev.id)} disabled={retrying === ev.id}
                            className="text-xs px-3 py-1.5 rounded-md bg-yellow-950 text-yellow-400 hover:bg-yellow-900 border border-yellow-900 disabled:opacity-40 transition-colors">
                            {retrying === ev.id ? "…" : "↺ Retry"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── ERROR SURFACE TAB ─── */}
          {tab === "errors" && (
            <div>
              {errors.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                  <p className="text-emerald-400 text-sm">✓ No errors detected</p>
                  <p className="text-neutral-600 text-xs mt-1">All workflow executions are healthy.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.map((e, i) => {
                    const hint = e.error.includes("rate limit") ? "Add a delay between syncs or upgrade your Shopify plan."
                      : e.error.includes("timeout")      ? "Check the service URL and your network connectivity."
                      : e.error.includes("unavailable")  ? "The target service is down. Check its status page."
                      : e.error.includes("not configured") ? "Add the required configuration to the workflow action."
                      : "Check the action configuration and retry.";
                    return (
                      <div key={i} className="bg-neutral-900 border border-red-900/40 rounded-xl px-5 py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded font-bold tabular-nums">
                                ×{e.count}
                              </span>
                              {e.retrying_count > 0 && (
                                <span className="text-xs bg-yellow-950 text-yellow-400 border border-yellow-900 px-2 py-0.5 rounded">
                                  {e.retrying_count} retrying
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-mono text-red-300 mt-1">{e.error}</p>
                          </div>
                          <div className="text-right text-xs text-neutral-600 shrink-0">
                            <p>Last seen</p>
                            <RelativeTime iso={e.last_seen} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {e.affected_workflows.map(wf => (
                            <span key={wf} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">{wf}</span>
                          ))}
                          {e.action_types.map(at => (
                            <span key={at} className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded">{actionLabel(at)}</span>
                          ))}
                        </div>

                        <div className="text-xs bg-yellow-950/30 border border-yellow-900/30 text-yellow-400 rounded px-3 py-2">
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
