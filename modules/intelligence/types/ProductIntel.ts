import { TrendPoint, HeatmapRow, ScoreSet } from "./Common";

export interface ProductIntel {
  productId: string;
  name: string;

  scores: ScoreSet;

  trends: {
    opportunity: TrendPoint[];
  };

  featureGaps: HeatmapRow[];
}
