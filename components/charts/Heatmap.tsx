"use client";

import { ResponsiveHeatMap } from "@nivo/heatmap";

export default function Heatmap({ data }: { data: any[] }) {
  return (
    <div className="h-64">
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
        colors={{ scheme: "reds" }}
      />
    </div>
  );
}
