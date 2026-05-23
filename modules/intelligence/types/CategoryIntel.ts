import { TrendPoint, HeatmapRow } from "./Common";

export interface CategoryIntel {
  categoryId: string;
  name: string;

  scores: {
    opportunity: number;
    saturation: number;
    velocity: number;
    avgReliability: number;
  };

  trends: {
    categoryTrend: TrendPoint[];
  };

  heatmap: HeatmapRow[];

  risingProducts: string[];
  decliningProducts: string[];
}
