"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function OpportunityChart({ data }: { data: any[] }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-subtle">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Opportunity Trend</h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#7A1F2A" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
