"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const sampleData = [
  { feature: "Durability", gap: 3 },
  { feature: "Noise", gap: 5 },
  { feature: "Efficiency", gap: 2 },
  { feature: "Weight", gap: 4 },
  { feature: "Heat", gap: 1 },
];

export default function FeatureRadarChart() {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-subtle">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Feature Gap Radar</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={sampleData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="feature" />
            <PolarRadiusAxis />
            <Radar
              name="Gap"
              dataKey="gap"
              stroke="#7A1F2A"
              fill="#7A1F2A"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
