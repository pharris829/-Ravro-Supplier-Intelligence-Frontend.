// ─── Shared ───────────────────────────────────────────────────────────────────
export interface TrendPoint {
  label: string;
  value: number;
}

export interface FeatureGapRow {
  id: string;
  data: { x: string; y: number }[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardScores {
  opportunity: number;
  saturation: number;
  velocity: number;
  reliability: number;
}

export interface DashboardTrends {
  opportunity: TrendPoint[];
  velocity: TrendPoint[];
  saturation: TrendPoint[];
}

export interface DashboardIntel {
  scores: DashboardScores;
  trends: DashboardTrends;
  featureGaps: FeatureGapRow[];
  alerts: string[];
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface ProductScores {
  opportunity: number;
  demand: number;
  saturation: number;
  featureGapSeverity: number;
}

export interface ProductIntel {
  productId: string;
  scores: ProductScores;
  trends: {
    opportunity: TrendPoint[];
  };
  featureGaps: FeatureGapRow[];
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export interface SupplierScores {
  reliability: number;
  catalogQuality: number;
  onTimeDelivery: number;
  riskIndex: number;
}

export interface CatalogRow {
  product: string;
  completeness: number;
  imageQuality: number;
  flags: string[];
}

export interface SupplierIntel {
  supplierId: string;
  scores: SupplierScores;
  catalog: CatalogRow[];
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface CategoryScores {
  opportunity: number;
  saturation: number;
  velocity: number;
  avgReliability: number;
}

export interface CategoryIntel {
  categoryId: string;
  scores: CategoryScores;
  risingProducts: string[];
  decliningProducts: string[];
  featureGaps: FeatureGapRow[];
}
