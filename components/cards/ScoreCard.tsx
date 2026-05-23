interface ScoreCardProps {
  title: string;
  value: number;
  trend: string;
}

export default function ScoreCard({ title, value, trend }: ScoreCardProps) {
  const positive = trend.startsWith("+");
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{title}</span>
      <span className="text-3xl font-bold">{value}</span>
      <span className={`text-sm font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
        {trend}
      </span>
    </div>
  );
}
