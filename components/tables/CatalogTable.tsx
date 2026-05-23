export default function CatalogTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 pr-4">Product</th>
            <th className="py-2 pr-4">SKU</th>
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Price</th>
            <th className="py-2">Quality Score</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-gray-400">
            <td className="py-4" colSpan={5}>No catalog data available</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
