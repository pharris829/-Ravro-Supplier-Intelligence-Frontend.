"use client";

import { ResponsiveHeatMap } from "@nivo/heatmap";

const sampleData = [
  {
    id: "Feature Gaps",
    data: [
      { x: "Durability", y: 3 },
      { x: "Noise", y: 5 },
      { x: "Efficiency", y: 2 },
      { x: "Weight", y: 4 },
      { x: "Heat", y: 1 },
    ],
  },
];

export default function Heatmap() {
  return (
    <div className="h-64">
      <ResponsiveHeatMap
        data={sampleData}
        margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
        colors={{ scheme: "reds" }}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
        }}
      />
    </div>
  );
}
