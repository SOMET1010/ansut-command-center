import { cn } from "@/lib/utils";

export type SignalLevel = "ok" | "warning" | "critical" | "stable";

const DOT_BG: Record<SignalLevel, string> = {
  ok: "bg-signal-ok",
  warning: "bg-signal-warning",
  critical: "bg-signal-critical",
  stable: "bg-signal-stable",
};

const LABELS: Record<SignalLevel, string> = {
  ok: "OK",
  warning: "Vigilance",
  critical: "Critique",
  stable: "Stable",
};

export function TrafficLight({
  level,
  label,
  className,
}: {
  level: SignalLevel;
  label?: string;
  className?: string;
}) {
  return (
    <span
      title={label ?? LABELS[level]}
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}
    >
      <span
        aria-hidden
        className={cn("inline-block h-2.5 w-2.5 rounded-full ring-2 ring-background", DOT_BG[level])}
      />
      <span className="sr-only">{label ?? LABELS[level]}</span>
    </span>
  );
}
