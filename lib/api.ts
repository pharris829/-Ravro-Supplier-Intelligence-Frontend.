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
