import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ScoreCard from "@/components/cards/ScoreCard";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Topbar />

        <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCard title="Opportunity Score" value={82} trend="+12%" />
          <ScoreCard title="Saturation Score" value={45} trend="-3%" />
          <ScoreCard title="Demand Velocity" value={67} trend="+5%" />
          <ScoreCard title="Supplier Reliability" value={91} trend="+1%" />
        </main>
      </div>
    </div>
  );
}
