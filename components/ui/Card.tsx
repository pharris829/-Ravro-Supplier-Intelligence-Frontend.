import { HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "mint" | "flat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  default:  "bg-surface-2 border border-surface-3 shadow-card",
  elevated: "bg-surface-2 border border-surface-3 shadow-elevated",
  mint:     "bg-surface-2 border border-surface-3 shadow-mint relative overflow-hidden card-mint-edge",
  flat:     "bg-surface-2 border border-surface-3",
};

export function Card({ variant = "default", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg p-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-3 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-sm font-semibold text-text-primary ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-text-secondary text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}
