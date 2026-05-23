import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

import ScoreCard from "@/components/cards/ScoreCard";
import OpportunityChart from "@/components/charts/OpportunityChart";
import Heatmap from "@/components/charts/Heatmap";
import RadarChart from "@/components/charts/RadarChart";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Topbar />

        <main className="p-6 flex flex-col gap-6 overflow-y-auto">

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard title="Opportunity Score" value={82} trend="+12%" />
            <ScoreCard title="Saturation Score" value={45} trend="-3%" />
            <ScoreCard title="Demand Velocity" value={67} trend="+5%" />
            <ScoreCard title="Supplier Reliability" value={91} trend="+1%" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OpportunityChart />
            <RadarChart />
          </div>

          {/* Heatmap */}
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2">Feature Gap Heatmap</h2>
            <Heatmap />
          </div>

          {/* Alerts */}
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2">Intelligence Alerts</h2>

            <ul className="flex flex-col gap-3 text-gray-700">
              <li className="border p-3 rounded-md">
                🔥 Product XYZ is trending upward 18% week-over-week.
              </li>
              <li className="border p-3 rounded-md">
                ⚠️ Supplier ABC has a rising defect rate.
              </li>
              <li className="border p-3 rounded-md">
                📈 Category HVAC Motors shows strong seasonal demand.
              </li>
            </ul>
          </div>

        </main>
      </div>
    </div>
  );
}
