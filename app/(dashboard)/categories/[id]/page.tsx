import ScoreCard from "@/components/cards/ScoreCard";
import Heatmap from "@/components/charts/Heatmap";

export default function CategoryPage({ params }: { params: { id: string } }) {
  const categoryId = params.id;

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        Category Intelligence <span className="text-maroon-500">#{categoryId}</span>
      </h1>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Category Opportunity" value={0} trend="--" />
        <ScoreCard title="Saturation Level" value={0} trend="--" />
        <ScoreCard title="Demand Velocity" value={0} trend="--" />
        <ScoreCard title="Avg. Supplier Reliability" value={0} trend="--" />
      </div>

      {/* Category Trend */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Category Trend</h2>
        <div className="h-40 flex items-center justify-center text-gray-400">
          Category trend chart goes here
        </div>
      </div>

      {/* Opportunity Heatmap */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Opportunity Heatmap</h2>
        <Heatmap />
      </div>

      {/* Top Rising Products */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Top Rising Products</h2>
        <div className="h-32 flex items-center justify-center text-gray-400">
          Rising products list goes here
        </div>
      </div>

      {/* Top Declining Products */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Top Declining Products</h2>
        <div className="h-32 flex items-center justify-center text-gray-400">
          Declining products list goes here
        </div>
      </div>
    </div>
  );
}
