import ScoreCard from "@/components/cards/ScoreCard";
import OpportunityChart from "@/components/charts/OpportunityChart";
import Heatmap from "@/components/charts/Heatmap";
import RadarChart from "@/components/charts/RadarChart";

export default function ProductIntelPage({ params }: { params: { id: string } }) {
  const productId = params.id;

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        Product Intelligence <span className="text-maroon-500">#{productId}</span>
      </h1>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Opportunity Score" value={0} trend="--" />
        <ScoreCard title="Demand Velocity" value={0} trend="--" />
        <ScoreCard title="Saturation Score" value={0} trend="--" />
        <ScoreCard title="Feature Gap Severity" value={0} trend="--" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpportunityChart />
        <RadarChart />
      </div>

      {/* Feature Gaps */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Feature Gap Analysis</h2>
        <Heatmap />
      </div>

      {/* Price Clustering */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Price Clustering</h2>
        <div className="h-40 flex items-center justify-center text-gray-400">
          Price chart goes here
        </div>
      </div>
    </div>
  );
}
