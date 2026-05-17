import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  delta?: number;
  deltaSuffix?: string;
  icon?: React.ReactNode;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
};

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  primary: "from-brand-500/20 to-purple-500/10 text-primary",
  success: "from-emerald-500/20 to-emerald-500/5 text-success",
  warning: "from-amber-500/20 to-amber-500/5 text-warning",
  destructive: "from-rose-500/20 to-rose-500/5 text-destructive",
};

export function KpiCard({
  label,
  value,
  delta,
  deltaSuffix = "%",
  icon,
  hint,
  accent = "primary",
}: Props) {
  const isPositive = (delta ?? 0) > 0;
  const isNeutral = !delta;

  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl opacity-70",
          ACCENT[accent]
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          {(delta !== undefined || hint) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {delta !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                    isNeutral && "bg-muted text-muted-foreground",
                    !isNeutral && isPositive && "bg-success/15 text-success",
                    !isNeutral && !isPositive && "bg-destructive/15 text-destructive"
                  )}
                >
                  {isNeutral ? (
                    <Minus className="h-3 w-3" />
                  ) : isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(delta).toFixed(1)}
                  {deltaSuffix}
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
              ACCENT[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
