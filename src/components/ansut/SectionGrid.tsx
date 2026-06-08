import { cn } from "@/lib/utils";
import { AnsutLogo } from "./Logo";

export function SectionGrid({
  title,
  action,
  children,
  className,
  cols = 3,
  withLogo = false,
  logoSuffix,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
  withLogo?: boolean;
  logoSuffix?: string;
}) {
  const colsCls =
    cols === 2
      ? "md:grid-cols-2"
      : cols === 4
        ? "md:grid-cols-2 lg:grid-cols-4"
        : "md:grid-cols-2 lg:grid-cols-3";
  return (
    <section className={cn("", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {withLogo && <AnsutLogo size="sm" />}
            {title ? (
              <div className="flex flex-col leading-tight">
                <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
                {withLogo && logoSuffix ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {logoSuffix}
                  </span>
                ) : null}
              </div>
            ) : (
              <span />
            )}
          </div>
          {action}
        </header>
      )}
      <div className={cn("grid grid-cols-1 gap-3 md:gap-4", colsCls)}>{children}</div>
    </section>
  );
}
