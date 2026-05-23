"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const sampleData = [
  { day: "Mon", velocity: 12 },
  { day: "Tue", velocity: 15 },
  { day: "Wed", velocity: 18 },
  { day: "Thu", velocity: 20 },
  { day: "Fri", velocity: 22 },
  { day: "Sat", velocity: 25 },
  { day: "Sun", velocity: 27 },
];

export default function DemandVelocityChart() {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-subtle">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Demand Velocity</h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sampleData}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="velocity"
              stroke="#7A1F2A"
              fill="#F9EDEE"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
