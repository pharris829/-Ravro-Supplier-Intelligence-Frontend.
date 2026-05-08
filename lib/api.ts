const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; user: { id: string; email: string; role: string } }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  localStorage.setItem("access_token", data.access_token);
  return data;
}

export async function register(email: string, password: string, role: string, name: string) {
  const data = await request<{ access_token: string; user: { id: string; email: string; role: string } }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify({ email, password, role, name }) }
  );
  localStorage.setItem("access_token", data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  window.location.href = "/login";
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
export async function getSuppliers(params?: { page?: number; limit?: number; category?: string; min_trust?: number }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<{ suppliers: Supplier[]; pagination: Pagination }>(`/suppliers${q ? `?${q}` : ""}`);
}

export async function getSupplier(id: string) {
  return request<{ supplier: Supplier }>(`/suppliers/${id}`);
}

export async function getSupplierProducts(id: string, params?: { page?: number; sort?: string; min_score?: number }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<{ products: Product[]; pagination: Pagination }>(`/suppliers/${id}/products${q ? `?${q}` : ""}`);
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function searchProducts(params: { q: string; category?: string; min_price?: number; max_price?: number; page?: number }) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  return request<{ products: Product[]; pagination: Pagination }>(`/products/search?${q}`);
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
  const res = await fetch(`${BASE_URL}/ingest/csv?type=${type}`, {
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

// ─── Types ────────────────────────────────────────────────────────────────────
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
  match_score?: number;
  demand_score?: number;
  ingestion_status: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_trust_score?: number;
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
