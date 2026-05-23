const CACHE_KEY = "ravro_feature_flags";

const DEFAULTS: Record<string, boolean> = {
  scoring_enabled:          true,
  csv_strict_validation:    false,
  opportunity_tier_badges:  true,
  merchant_access_requests: true,
  supplier_analytics:       true,
  shopify_sync:             true,
  woo_sync:                 false,
  etsy_sync:                false,
  billing_module:           true,
  paid_plans:               false,
  rate_limiting:            true,
  debug_mode:               false,
};

export function getFlag(key: string): boolean {
  if (typeof window === "undefined") return DEFAULTS[key] ?? false;
  try {
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    if (!stored) return DEFAULTS[key] ?? false;
    return stored[key] ?? DEFAULTS[key] ?? false;
  } catch {
    return DEFAULTS[key] ?? false;
  }
}

export function setFlagsCache(flags: Record<string, boolean>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(flags));
  } catch { /* ignore */ }
}
