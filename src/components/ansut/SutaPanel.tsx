import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function SutaPanel({
  title = "Suggestions SUTA",
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("suta-border-animated rounded-lg bg-card p-4 md:p-5", className)}
      aria-label="Panneau d'analyse IA SUTA"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-suta-purple-light px-2 text-[10px] font-bold uppercase tracking-wider text-suta-purple">
            <Sparkles className="h-3 w-3" />
            IA
          </span>
          <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {subtitle ? <span className="text-[11px] text-muted-foreground">{subtitle}</span> : null}
      </div>
      <div className="text-sm leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}
