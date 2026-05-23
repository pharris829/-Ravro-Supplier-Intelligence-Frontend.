import { TrendPoint } from "./Common";

export interface CatalogQualityRow {
  productName: string;
  completeness: number;
  imageQuality: number;
  flags: string[];
}

export interface SupplierIntel {
  supplierId: string;
  name: string;

  scores: {
    reliability: number;
    catalogQuality: number;
    onTimeDelivery: number;
    riskIndex: number;
  };

  trends: {
    reliability: TrendPoint[];
  };

  catalog: CatalogQualityRow[];

  risks: string[];
}
