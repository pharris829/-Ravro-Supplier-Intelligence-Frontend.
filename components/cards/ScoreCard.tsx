interface ScoreCardProps {
  title: string;
  value: number;
  trend: string;
}

export default function ScoreCard({ title, value, trend }: ScoreCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>

      <div className="mt-2 text-3xl font-bold">{value}</div>

      <div className="mt-1 text-sm text-green-600">{trend}</div>
    </div>
  );
}
