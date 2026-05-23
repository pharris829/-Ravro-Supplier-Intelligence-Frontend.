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
