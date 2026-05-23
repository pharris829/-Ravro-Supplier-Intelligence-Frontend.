type BadgeLevel = "info" | "success" | "warning" | "critical" | "neutral";

const levels: Record<BadgeLevel, string> = {
  info:     "bg-blue/15 text-blue border-blue/20",
  success:  "bg-mint/15 text-mint border-mint/20",
  warning:  "bg-amber/15 text-amber border-amber/20",
  critical: "bg-red/15 text-red border-red/20",
  neutral:  "bg-surface-3 text-text-secondary border-surface-3",
};

interface BadgeProps {
  level?: BadgeLevel;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ level = "neutral", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${levels[level]} ${className}`}
    >
      {children}
    </span>
  );
}
