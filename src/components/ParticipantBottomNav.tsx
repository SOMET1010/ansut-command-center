import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, Users, Info, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navigation Participant — 5 entrées (Phase 5, refonte).
 *
 *   Accueil          → /e/$slug
 *   Agenda            → /e/$slug/agenda
 *   Annuaire          → /e/$slug/reseau
 *   Infos pratiques   → /e/$slug/annonces
 *   Profil            → /e/$slug/profil
 *
 * Position fixed bottom — padding-bottom appliqué sur <body>.
 */
export function ParticipantBottomNav({ slug }: { slug: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "5rem";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, []);

  const items: Array<{
    label: string;
    icon: typeof Home;
    to: string;
    matches: (p: string) => boolean;
  }> = [
    {
      label: "Accueil",
      icon: Home,
      to: `/e/${slug}`,
      matches: (p) => p === `/e/${slug}`,
    },
    {
      label: "Agenda",
      icon: CalendarDays,
      to: `/e/${slug}/agenda`,
      matches: (p) => p.startsWith(`/e/${slug}/agenda`),
    },
    {
      label: "Annuaire",
      icon: Users,
      to: `/e/${slug}/reseau`,
      matches: (p) => p.startsWith(`/e/${slug}/reseau`),
    },
    {
      label: "Infos pratiques",
      icon: Info,
      to: `/e/${slug}/annonces`,
      matches: (p) => p.startsWith(`/e/${slug}/annonces`),
    },
    {
      label: "Profil",
      icon: User,
      to: `/e/${slug}/profil`,
      matches: (p) => p.startsWith(`/e/${slug}/profil`),
    },
  ];

  return (
    <nav
      aria-label="Navigation participant"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {items.map((it) => {
          const active = it.matches(pathname);
          const Icon = it.icon;
          return (
            <li key={it.label}>
              <Link
                to={it.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className="truncate">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

