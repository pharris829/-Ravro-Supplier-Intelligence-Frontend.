export default function CatalogTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2">Product</th>
            <th className="p-2">Completeness</th>
            <th className="p-2">Image Quality</th>
            <th className="p-2">Flags</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b">
            <td className="p-2 text-gray-400">Product row</td>
            <td className="p-2 text-gray-400">--</td>
            <td className="p-2 text-gray-400">--</td>
            <td className="p-2 text-gray-400">--</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
