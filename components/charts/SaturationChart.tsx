"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SaturationChart({ data }: { data: any[] }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-subtle">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Market Saturation</h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#7A1F2A" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
