import { AlertTriangle, Info, ShieldAlert, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SignalLevel } from "./TrafficLight";

const STYLES: Record<SignalLevel, { bg: string; border: string; text: string; icon: LucideIcon }> = {
  critical: {
    bg: "bg-ansut-danger-light",
    border: "border-signal-critical",
    text: "text-signal-critical",
    icon: ShieldAlert,
  },
  warning: {
    bg: "bg-ansut-orange-light",
    border: "border-signal-warning",
    text: "text-signal-warning",
    icon: AlertTriangle,
  },
  stable: {
    bg: "bg-accent",
    border: "border-signal-stable",
    text: "text-signal-stable",
    icon: Info,
  },
  ok: {
    bg: "bg-accent",
    border: "border-signal-ok",
    text: "text-signal-ok",
    icon: CheckCircle2,
  },
};

export function AlertBanner({
  level = "critical",
  title,
  children,
  action,
  className,
}: {
  level?: SignalLevel;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const s = STYLES[level];
  const Icon = s.icon;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-md border-l-4 p-3",
        s.bg,
        s.border,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", s.text)} />
      <div className="min-w-0 flex-1">
        <div className={cn("text-sm font-semibold", s.text)}>{title}</div>
        {children ? (
          <div className="mt-0.5 text-xs text-foreground/80">{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
