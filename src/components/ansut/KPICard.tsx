import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrafficLight, type SignalLevel } from "./TrafficLight";

type Trend = "up" | "down" | "flat";

export function KPICard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  trendValue,
  level,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: Trend;
  trendValue?: string;
  level?: SignalLevel;
  className?: string;
}) {
  const trendColor =
    trend === "up"
      ? "text-signal-ok"
      : trend === "down"
        ? "text-signal-critical"
        : "text-muted-foreground";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <div
      className={cn(
        "card-elevated card-elevated-hover rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-primary">
            <Icon className="h-4 w-4" />
          </div>
        ) : level ? (
          <TrafficLight level={level} />
        ) : null}
      </div>

      <div className="mt-3 font-display text-3xl font-bold tabular-nums text-foreground">
        {value}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : <span />}
        {trend && trendValue ? (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </span>
        ) : null}
      </div>
    </div>
  );
}
