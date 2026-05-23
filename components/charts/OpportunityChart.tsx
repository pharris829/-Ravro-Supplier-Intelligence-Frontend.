"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const sampleData = [
  { day: "Mon", score: 62 },
  { day: "Tue", score: 65 },
  { day: "Wed", score: 70 },
  { day: "Thu", score: 72 },
  { day: "Fri", score: 75 },
  { day: "Sat", score: 78 },
  { day: "Sun", score: 82 },
];

export default function OpportunityChart() {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-subtle">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Opportunity Trend</h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampleData}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#7A1F2A" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
