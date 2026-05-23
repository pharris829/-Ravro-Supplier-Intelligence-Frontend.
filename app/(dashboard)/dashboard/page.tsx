"use client";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

import ScoreCard from "@/components/cards/ScoreCard";
import OpportunityChart from "@/components/charts/OpportunityChart";
import DemandVelocityChart from "@/components/charts/DemandVelocityChart";
import SaturationChart from "@/components/charts/SaturationChart";
import Heatmap from "@/components/charts/Heatmap";

import { useDashboardIntel } from "@/modules/intelligence/hooks/useDashboardIntel";

export default function DashboardPage() {
  const { data, loading } = useDashboardIntel();

  if (loading) {
    return <div className="p-6">Loading intelligence...</div>;
  }

  const scores = data.scores;
  const trends = data.trends;

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Topbar />

        <main className="p-6 flex flex-col gap-6 overflow-y-auto">

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard title="Opportunity Score" value={scores.opportunity} trend="+12%" />
            <ScoreCard title="Saturation Score" value={scores.saturation} trend="-3%" />
            <ScoreCard title="Demand Velocity" value={scores.velocity} trend="+5%" />
            <ScoreCard title="Supplier Reliability" value={scores.reliability} trend="+1%" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OpportunityChart data={trends.opportunity} />
            <DemandVelocityChart data={trends.velocity} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SaturationChart data={trends.saturation} />
            <Heatmap data={data.featureGaps} />
          </div>

          {/* Alerts */}
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2">Intelligence Alerts</h2>

            <ul className="flex flex-col gap-3 text-gray-700">
              {data.alerts.map((alert: string, i: number) => (
                <li key={i} className="border p-3 rounded-md">
                  {alert}
                </li>
              ))}
            </ul>
          </div>

        </main>
      </div>
    </div>
  );
}
