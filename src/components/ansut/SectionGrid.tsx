import { cn } from "@/lib/utils";

export function SectionGrid({
  title,
  action,
  children,
  className,
  cols = 3,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
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
          {title ? (
            <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          ) : <span />}
          {action}
        </header>
      )}
      <div className={cn("grid grid-cols-1 gap-3 md:gap-4", colsCls)}>{children}</div>
    </section>
  );
}
