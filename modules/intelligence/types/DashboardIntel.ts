import { ScoreSet, TrendPoint, HeatmapRow, AlertMessage } from "./Common";

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
