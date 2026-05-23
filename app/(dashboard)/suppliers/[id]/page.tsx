import ScoreCard from "@/components/cards/ScoreCard";
import CatalogTable from "@/components/tables/CatalogTable";

export default function SupplierPage({ params }: { params: { id: string } }) {
  const supplierId = params.id;

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        Supplier Profile <span className="text-maroon-500">#{supplierId}</span>
      </h1>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Reliability Score" value={0} trend="--" />
        <ScoreCard title="Catalog Quality" value={0} trend="--" />
        <ScoreCard title="On-Time Delivery" value={0} trend="--" />
        <ScoreCard title="Risk Index" value={0} trend="--" />
      </div>

      {/* Reliability Trend */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Reliability Trend</h2>
        <div className="h-40 flex items-center justify-center text-gray-400">
          Reliability chart goes here
        </div>
      </div>

      {/* Catalog Quality Table */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Catalog Quality</h2>
        <CatalogTable />
      </div>

      {/* Risk Indicators */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Risk Indicators</h2>
        <div className="h-32 flex items-center justify-center text-gray-400">
          Risk indicators go here
        </div>
      </div>
    </div>
  );
}
