import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrafficLight, type SignalLevel } from "./TrafficLight";
import { AnsutLogo } from "./Logo";

export function ExecHero({
  eyebrow,
  title,
  subtitle,
  primaryLabel,
  primaryValue,
  primaryHint,
  primaryLevel,
  satellites,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryLabel: string;
  primaryValue: string | number;
  primaryHint?: string;
  primaryLevel?: SignalLevel;
  satellites?: Array<{ label: string; value: string | number; hint?: string }>;
  className?: string;
}) {
  return (
    <section
      className={cn("relative overflow-hidden rounded-xl text-white", className)}
      style={{ background: "var(--gradient-kpi-hero)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 md:right-6 md:top-6">
        <AnsutLogo size="sm" />
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:inline">
          Console DG
        </span>
      </div>
      <div className="relative grid gap-6 p-5 md:p-6 lg:grid-cols-[1.1fr_2fr] lg:items-center">
        <div>
          {eyebrow ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-2.5 py-1">
              <Sparkles className="h-3 w-3 text-secondary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                {eyebrow}
              </span>
            </div>
          ) : null}
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1.5 max-w-xl text-sm text-white/70">{subtitle}</p> : null}

          <div className="mt-5 rounded-lg border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                {primaryLabel}
              </span>
              {primaryLevel ? <TrafficLight level={primaryLevel} /> : null}
            </div>
            <div className="mt-2 font-display text-4xl font-bold tabular-nums">{primaryValue}</div>
            {primaryHint ? <div className="mt-1 text-xs text-white/65">{primaryHint}</div> : null}
          </div>
        </div>

        {satellites && satellites.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {satellites.map((s) => (
              <div key={s.label} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/75">
                  {s.label}
                </div>
                <div className="mt-1 font-display text-xl font-bold tabular-nums">{s.value}</div>
                {s.hint ? <div className="mt-0.5 text-[11px] text-white/70">{s.hint}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
