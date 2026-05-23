"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const sampleData = [
  { category: "A", saturation: 40 },
  { category: "B", saturation: 55 },
  { category: "C", saturation: 70 },
  { category: "D", saturation: 30 },
];

export default function SaturationChart() {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-subtle">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Market Saturation</h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sampleData}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="saturation" fill="#7A1F2A" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
