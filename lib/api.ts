// All requests go through the Next.js proxy at /api/* → backend
const BASE = "/api";

// ─── Token helpers (localStorage + cookie so middleware can read it) ──────────
function setToken(token: string) {
  localStorage.setItem("access_token", token);
  document.cookie = `access_token=${token}; path=/; SameSite=Lax; max-age=${7 * 24 * 60 * 60}`;
}

function clearToken() {
  localStorage.removeItem("access_token");
  document.cookie = "access_token=; path=/; max-age=0";
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; user: User }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  setToken(data.access_token);
  return data;
}

export async function register(email: string, password: string, role: string, name: string) {
  const data = await request<{ access_token: string; user: User }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify({ email, password, role, name }) }
  );
  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken();
  window.location.href = "/login";
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
export async function getSuppliers(params?: { page?: number; limit?: number; category?: string; min_trust?: number }) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  return request<{ suppliers: Supplier[]; pagination: Pagination }>(`/suppliers${q ? `?${q}` : ""}`);
}

export async function getSupplier(id: string) {
  return request<{ supplier: Supplier }>(`/suppliers/${id}`);
}

export async function getSupplierProducts(id: string, params?: { page?: number; sort?: string; min_score?: number }) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  return request<{ supplier_id: string; products: Product[]; pagination: Pagination }>(`/suppliers/${id}/products${q ? `?${q}` : ""}`);
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function searchProducts(params: { q: string; category?: string; min_price?: number; max_price?: number; page?: number }) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  return request<{ query: string; products: Product[]; pagination: Pagination }>(`/products/search?${q}`);
}

export async function getProduct(id: string) {
  return request<{ product: Product }>(`/products/${id}`);
}

export async function getProductScores(id: string) {
  return request<ProductScores>(`/products/${id}/scores`);
}

export async function getProductOpportunity(id: string) {
  return request<ProductOpportunity>(`/products/${id}/opportunity`);
}

// ─── Ingest ───────────────────────────────────────────────────────────────────
export async function uploadCSV(file: File, type: "suppliers" | "products") {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest/csv?type=${type}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data as { batchId: string; status: string };
}

export async function getBatchStatus(batchId: string) {
  return request<BatchStatus>(`/ingest/status/${batchId}`);
}

// ─── Developer API (v1 public + webhooks) ─────────────────────────────────────
export async function getApiV1Info() {
  return request<{ api: string; version: string; endpoints: string[] }>("/api/v1");
}
export async function getApiChangelog() {
  return request<{ changelog: ApiChangelog[] }>("/developer/changelog");
}
export async function getWebhookEndpoints() {
  return request<{ data: WebhookEndpoint[]; available_events: string[] }>("/api/v1/webhooks");
}
export async function createWebhookEndpoint(data: { url: string; events: string[]; description?: string }) {
  return request<{ data: WebhookEndpoint }>("/api/v1/webhooks", { method: "POST", body: JSON.stringify(data) });
}
export async function updateWebhookEndpoint(id: string, data: Partial<WebhookEndpoint>) {
  return request<{ data: WebhookEndpoint }>(`/api/v1/webhooks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}
export async function deleteWebhookEndpoint(id: string) {
  return request<{ deleted: boolean }>(`/api/v1/webhooks/${id}`, { method: "DELETE" });
}
export async function testWebhookEndpoint(id: string) {
  return request<{ sent: boolean }>(`/api/v1/webhooks/${id}/test`, { method: "POST" });
}
export async function getWebhookDeliveries(id: string) {
  return request<{ data: WebhookDelivery[] }>(`/api/v1/webhooks/${id}/deliveries`);
}

export interface WebhookEndpoint {
  id: string; url: string; description?: string; events: string[];
  secret_hint: string; secret?: string; enabled: boolean;
  delivery_count?: number; failure_count?: number; created_at: string;
}
export interface WebhookDelivery {
  id: string; event_type: string; status: string;
  response_status?: number; attempts: number; duration_ms?: number; created_at: string;
}
export interface ApiChangelog {
  id: string; version: string; title: string; description: string;
  breaking: boolean; released_at: string;
}

// ─── Observability ────────────────────────────────────────────────────────────
export async function getObservabilityOverview() {
  return request<ObsOverview>("/observability/overview");
}
export async function getRequestLogs(params?: { status_class?: string; method?: string; path?: string; limit?: number; offset?: number }) {
  const q = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=>v!=null).map(([k,v])=>[k,String(v)]))).toString() : "";
  return request<{ requests: RequestLog[]; total: number }>(`/observability/requests${q}`);
}
export async function getErrorLogs(resolved = false) {
  return request<{ errors: ErrorLog[] }>(`/observability/errors?resolved=${resolved}`);
}
export async function resolveErrorLog(id: string, resolved = true) {
  return request<{ error_log: ErrorLog }>(`/observability/errors/${id}/resolve`, { method: "PATCH", body: JSON.stringify({ resolved }) });
}
export async function deleteErrorLog(id: string) {
  return request<{ deleted: boolean }>(`/observability/errors/${id}`, { method: "DELETE" });
}
export async function clearResolvedErrors() {
  return request<{ deleted: number }>("/observability/errors", { method: "DELETE" });
}
export async function getObsMetrics() {
  return request<ObsMetrics>("/observability/metrics");
}
export async function getObsEvents(status?: string) {
  const q = status ? `?status=${status}` : "";
  return request<{ events: ObsEvent[] }>(`/observability/events${q}`);
}

export interface RequestLog {
  id: string; method: string; path: string; status_code: number; duration_ms: number;
  user_id?: string; user_role?: string; ip_address?: string; user_agent?: string;
  error_msg?: string; created_at: string;
}
export interface ErrorLog {
  id: string; fingerprint: string; level: string; message: string; stack?: string;
  code?: string; path?: string; method?: string; status_code?: number;
  occurrence_count: number; resolved: boolean; first_seen: string; last_seen: string;
}
export interface ObsOverview {
  realtime: { requests_1m: number; errors_1m: number; error_rate: string; p50_ms: number; p95_ms: number; p99_ms: number; top_paths: { path: string; count: number }[]; slowest_paths: { path: string; avg_ms: number }[] };
  status_distribution: { bucket: string; count: number }[];
  hourly_volume: { hour: string; requests: number; errors: number; avg_ms: number }[];
  top_errors: ErrorLog[];
}
export interface ObsMetrics {
  realtime: ObsOverview["realtime"];
  snapshots: { req_count: number; err_count: number; p50_ms: number; p95_ms: number; p99_ms: number; error_rate: number; recorded_at: string }[];
  slow_endpoints: { path: string; req_count: number; avg_ms: number; max_ms: number; p95_ms: number }[];
  busy_endpoints: { path: string; req_count: number; avg_ms: number; error_count: number }[];
}
export interface ObsEvent {
  id: string; workflow_name: string; trigger_type: string; action_type: string;
  status: string; error?: string; attempts: number; duration_ms?: number; created_at: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export async function getBilling() {
  return request<BillingOverview>("/billing");
}
export async function getBillingPlans() {
  return request<{ plans: BillingPlan[]; stripe_configured: boolean }>("/billing/plans");
}
export async function createCheckout(plan: string) {
  return request<{ url: string; demo: boolean }>("/billing/checkout", {
    method: "POST", body: JSON.stringify({ plan }),
  });
}
export async function createPortal() {
  return request<{ url: string; demo: boolean }>("/billing/portal", { method: "POST" });
}
export async function cancelSubscription() {
  return request<{ cancelled: boolean }>("/billing/cancel", { method: "POST" });
}
export async function getBillingInvoices() {
  return request<{ invoices: BillingInvoice[] }>("/billing/invoices");
}
export async function upgradePlanDemo(plan: string) {
  return request<{ upgraded: boolean; plan: string }>("/billing/upgrade", {
    method: "POST", body: JSON.stringify({ plan }),
  });
}

export interface BillingPlan {
  id: string; name: string; price: number | null; interval: string | null;
  limits: Record<string, number>; features: string[];
}
export interface UsageMeter {
  metric: string; used: number; limit: number; pct: number;
}
export interface BillingSubscription {
  id: string; user_id: string; plan: string; status: string;
  trial_ends_at?: string; current_period_end: string;
  cancel_at_period_end: boolean; stripe_configured?: boolean;
}
export interface BillingOverview {
  subscription: BillingSubscription | null;
  plan: BillingPlan;
  trial_days_remaining: number | null;
  meters: UsageMeter[];
  stripe_configured: boolean;
}
export interface BillingInvoice {
  id: string; type: string; amount?: number; currency: string;
  description?: string; status: string; created_at: string;
}

// ─── Auth settings ────────────────────────────────────────────────────────────
export async function getMe() {
  return request<{ user: User; permissions: { resource: string; action: string }[] }>("/auth/settings/me");
}
// API keys
export async function getApiKeys() {
  return request<{ api_keys: ApiKey[] }>("/auth/settings/api-keys");
}
export async function createApiKey(data: { name: string; scopes: string[]; expires_at?: string }) {
  return request<{ api_key: ApiKey & { raw_key: string } }>("/auth/settings/api-keys", {
    method: "POST", body: JSON.stringify(data),
  });
}
export async function revokeApiKey(id: string) {
  return request<{ revoked: { id: string; name: string } }>(`/auth/settings/api-keys/${id}`, { method: "DELETE" });
}
// OAuth apps
export async function getOAuthApps() {
  return request<{ apps: OAuthApp[] }>("/auth/settings/oauth/apps");
}
export async function createOAuthApp(data: { name: string; description?: string; redirect_uris: string[]; scopes: string[] }) {
  return request<{ app: OAuthApp & { client_secret: string } }>("/auth/settings/oauth/apps", {
    method: "POST", body: JSON.stringify(data),
  });
}
export async function deleteOAuthApp(id: string) {
  return request<{ deleted: { id: string; name: string } }>(`/auth/settings/oauth/apps/${id}`, { method: "DELETE" });
}
// Sessions
export async function getSessions() {
  return request<{ sessions: Session[] }>("/auth/settings/sessions");
}
export async function revokeSession(id: string) {
  return request<{ revoked: boolean }>(`/auth/settings/sessions/${id}`, { method: "DELETE" });
}
// RBAC (admin)
export async function getRbac() {
  return request<{ permissions: { role: string; resource: string; action: string }[] }>("/admin/rbac");
}
export async function grantPermission(role: string, resource: string, action: string) {
  return request<{ granted: unknown }>(`/admin/rbac/${role}/${resource}/${action}`, { method: "PUT" });
}
export async function revokePermission(role: string, resource: string, action: string) {
  return request<{ revoked: unknown }>(`/admin/rbac/${role}/${resource}/${action}`, { method: "DELETE" });
}

export interface ApiKey {
  id: string; name: string; key_prefix: string; scopes: string[];
  last_used_at?: string; expires_at?: string; revoked: boolean; created_at: string;
}
export interface OAuthApp {
  id: string; name: string; description?: string; client_id: string;
  redirect_uris: string[]; scopes: string[]; created_at: string;
}
export interface Session {
  id: string; ip_address?: string; user_agent?: string;
  last_active_at: string; revoked: boolean; created_at: string;
}

// ─── Workflows ────────────────────────────────────────────────────────────────
export async function getWorkflows() {
  return request<{ workflows: Workflow[] }>("/workflows");
}
export async function createWorkflow(data: Partial<Workflow>) {
  return request<{ workflow: Workflow }>("/workflows", { method: "POST", body: JSON.stringify(data) });
}
export async function updateWorkflow(id: string, data: Partial<Workflow>) {
  return request<{ workflow: Workflow }>(`/workflows/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}
export async function deleteWorkflow(id: string) {
  return request<{ deleted: { id: string; name: string } }>(`/workflows/${id}`, { method: "DELETE" });
}
export async function getWorkflowEvents(status?: string) {
  const q = status ? `?status=${status}` : "";
  return request<{ events: WorkflowEvent[] }>(`/workflows/events${q}`);
}
export async function getRetryQueue() {
  return request<{ events: WorkflowEvent[] }>("/workflows/retry-queue");
}
export async function retryWorkflowEvent(id: string) {
  return request<{ status: string; error?: string }>(`/workflows/events/${id}/retry`, { method: "POST" });
}
export async function retryAllEvents() {
  return request<{ attempted: number; succeeded: number }>("/workflows/retry-all", { method: "POST" });
}
export async function getWorkflowErrors() {
  return request<{ errors: WorkflowError[] }>("/workflows/errors");
}
export async function triggerWorkflowEvent(type: string, data?: Record<string, unknown>) {
  return request<{ triggered: number; results: unknown[] }>("/workflows/trigger", {
    method: "POST", body: JSON.stringify({ type, data: data ?? {} }),
  });
}
export interface Workflow {
  id: string; user_id: string; name: string; description?: string; enabled: boolean;
  trigger_type: string; trigger_config: Record<string, unknown>;
  condition_config: Record<string, unknown>; action_type: string;
  action_config: Record<string, unknown>;
  run_count: number; last_run_at?: string;
  event_count?: number; error_count?: number;
  created_at: string; updated_at: string;
}
export interface WorkflowEvent {
  id: string; workflow_id?: string; workflow_name: string;
  trigger_type: string; trigger_data: Record<string, unknown>;
  action_type: string; action_config: Record<string, unknown>;
  status: "pending"|"running"|"success"|"failed"|"retrying"|"cancelled";
  result?: Record<string, unknown>; error?: string;
  attempts: number; max_attempts: number; next_retry_at?: string;
  duration_ms?: number; created_at: string; updated_at: string;
}
export interface WorkflowError {
  error: string; count: number; last_seen: string;
  affected_workflows: string[]; action_types: string[]; retrying_count: number;
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export async function getRecommendations() {
  return request<RecommendationsPayload>("/recommendations");
}
export interface RecommendationProduct extends Product {
  why?: string;
  score_delta?: number;
  prev_score?: number;
  current_score?: number;
  pct_change?: number;
  supplier_trust?: number;
}
export interface NicheRecommendation {
  category: string;
  product_count: number;
  avg_saturation: number;
  avg_demand: number;
  avg_match: number;
  avg_profitability: number;
  opportunity_gap: number;
  tier: "high" | "medium" | "low";
  top_product?: string;
}
export interface RecommendationsPayload {
  opportunities: RecommendationProduct[];
  trending: RecommendationProduct[];
  niches: NicheRecommendation[];
  generated_at: string;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
export async function getScoringConfig() {
  return request<{ configs: ScoringConfig[] }>("/scoring/config");
}
export async function updateScoringConfig(key: string, value: number) {
  return request<{ config: ScoringConfig }>(`/scoring/config/${key}`, {
    method: "PUT", body: JSON.stringify({ value }),
  });
}
export async function getScoringDistributions() {
  return request<Record<string, ScoreBucket[]>>("/scoring/distributions");
}
export async function getScoringSummary() {
  return request<{ summary: ScoringSummary }>("/scoring/summary");
}
export async function getScoringTopProducts(model: string, dir: "asc" | "desc" = "desc", limit = 10) {
  return request<{ products: Product[] }>(`/scoring/top?model=${model}&dir=${dir}&limit=${limit}`);
}
export async function runScoring() {
  return request<{ scored: number; message: string }>("/scoring/run", { method: "POST" });
}
export interface ScoringConfig {
  key: string; value: number; label: string; description?: string; group_name: string;
}
export interface ScoreBucket { bucket: string; count: number; }
export interface ScoringSummary {
  total: number; demand_scored: number; saturation_scored: number;
  profitability_scored: number; match_scored: number;
  avg_demand: number; avg_saturation: number; avg_profitability: number; avg_match: number;
  last_scored_at: string | null;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  return request<{ users: number; suppliers: number; products: number; pendingProducts: number; activeBatches: number }>("/admin/stats");
}
export async function getAdminUsers() {
  return request<{ users: AdminUser[] }>("/admin/users");
}
export async function patchAdminUser(id: string, role: string) {
  return request<{ user: AdminUser }>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
}
export async function deleteAdminUser(id: string) {
  return request<{ deleted: { id: string; email: string } }>(`/admin/users/${id}`, { method: "DELETE" });
}
export async function getAdminSuppliers() {
  return request<{ suppliers: AdminSupplier[] }>("/admin/suppliers");
}
export async function patchAdminSupplier(id: string, fields: { trust_score?: number; reliability_score?: number; categories?: string[] }) {
  return request<{ supplier: AdminSupplier }>(`/admin/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(fields) });
}
export async function getAdminBatches() {
  return request<{ batches: AdminBatch[] }>("/admin/batches");
}
export async function triggerScoring() {
  return request<{ triggered: boolean; message: string }>("/admin/scoring/run", { method: "POST" });
}
export async function markStaleProducts(days: number) {
  return request<{ marked: number; days: number }>("/admin/products/mark-stale", { method: "POST", body: JSON.stringify({ days }) });
}
export async function getHealth() {
  return request<{ status: string; timestamp: string }>("/health");
}

export interface AdminUser {
  id: string; email: string; name?: string; role: string; created_at: string; updated_at: string;
}
export interface AdminSupplier {
  id: string; name: string; email?: string; country?: string; categories: string[];
  trust_score?: number; reliability_score?: number; product_count?: number;
  owner_email?: string; owner_name?: string; created_at: string;
}
export interface AdminBatch {
  id: string; filename: string; type: string; status: string;
  total_rows: number; processed_rows: number; error_count: number; created_at: string;
}

// ─── Supplier portal ──────────────────────────────────────────────────────────
export async function getMySupplierProfile() {
  const r = await getSuppliers({ limit: 1 });
  return r.suppliers[0] ?? null;
}

export async function getMyProducts(params?: { page?: number; limit?: number; sort?: string }) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  // When called as a supplier the backend automatically scopes to their own products
  const r = await request<{ supplier_id: string; products: Product[]; pagination: Pagination }>(
    `/suppliers/me/products${q ? `?${q}` : ""}`
  ).catch(async () => {
    // Fallback: get supplier id then fetch their products
    const profile = await getMySupplierProfile();
    if (!profile) return { supplier_id: "", products: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    return getSupplierProducts(profile.id, params);
  });
  return r;
}

export async function patchProduct(id: string, fields: {
  price?: number;
  stock_quantity?: number;
  brand?: string;
  description?: string;
  lead_time_days?: number;
}) {
  return request<{ product: Product }>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  website?: string;
  country?: string;
  categories: string[];
  trust_score: number;
  reliability_score: number;
  product_count?: number;
  avg_match_score?: number;
  created_at: string;
}

export interface Product {
  id: string;
  product_name: string;
  sku?: string;
  category?: string;
  price?: number;
  stock_quantity: number;
  brand?: string;
  description?: string;
  match_score?: number;
  demand_score?: number;
  saturation_score?: number;
  profitability_score?: number;
  ingestion_status: string;
  validation_errors?: unknown[];
  supplier_id?: string;
  supplier_name?: string;
  supplier_trust_score?: number;
  supplier_reliability_score?: number;
}

export interface ProductScores {
  product_id: string;
  product_name: string;
  sku?: string;
  scores: {
    opportunity_score: number;
    demand_score: number;
    supplier_trust: number;
    supplier_reliability: number;
  };
  weights: Record<string, number>;
  scored_at: string;
}

export interface ProductOpportunity {
  product_id: string;
  product_name: string;
  opportunity_score: number;
  opportunity_tier: "high" | "medium" | "low";
  demand_score: number;
  supplier: { name: string; trust_score: number; reliability_score: number };
  market_context: { competitors_in_category: number };
}

export interface BatchStatus {
  id: string;
  filename: string;
  type: string;
  status: "pending" | "processing" | "done" | "failed";
  total_rows: number;
  processed_rows: number;
  error_count: number;
  errors: { row: number; error: string }[];
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
