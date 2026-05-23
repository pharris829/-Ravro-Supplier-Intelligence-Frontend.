// ─── Shared ───────────────────────────────────────────────────────────────────
export interface TrendPoint {
  label: string;   // e.g., "Mon", "Week 12", "Q1"
  value: number;   // score or metric value
}

export interface ScoreSet {
  opportunity: number;
  saturation: number;
  velocity: number;
  reliability: number;
}

export interface FeatureGap {
  feature: string;
  severity: number; // 1–5 scale
}

export interface HeatmapRow {
  id: string; // row label
  data: { x: string; y: number }[]; // Nivo heatmap format
}

export interface AlertMessage {
  message: string;
  level: "info" | "warning" | "critical";
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardIntel {
  scores: ScoreSet;
  trends: {
    opportunity: TrendPoint[];
    velocity: TrendPoint[];
    saturation: TrendPoint[];
  };
  featureGaps: HeatmapRow[];
  alerts: AlertMessage[];
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface ProductIntel {
  productId: string;
  scores: ScoreSet;
  trends: {
    opportunity: TrendPoint[];
  };
  featureGaps: HeatmapRow[];
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export interface CatalogRow {
  product: string;
  completeness: number;
  imageQuality: number;
  flags: string[];
}

export interface SupplierIntel {
  supplierId: string;
  scores: ScoreSet;
  catalog: CatalogRow[];
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface CategoryIntel {
  categoryId: string;
  scores: ScoreSet;
  risingProducts: string[];
  decliningProducts: string[];
  featureGaps: HeatmapRow[];
}
