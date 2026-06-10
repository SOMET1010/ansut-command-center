import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, Users, Info, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navigation Participant — 5 entrées (Phase 4.1, finale).
 *
 *   Accueil      → /e/$slug
 *   Programme    → /agenda/$slug          (sessions & check-in)
 *   Participants → /networking/$slug      (Découvrir · Messages · Rendez-vous)
 *   Salon        → /salon/$slug           (Infos pratiques · Annonces · Sondages)
 *   Mon Profil   → /me/$slug
 *
 * Position fixed bottom — l'insertion dans le JSX n'a pas d'importance.
 * Padding-bottom appliqué sur <body> pour éviter le recouvrement.
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
      label: "Programme",
      icon: CalendarDays,
      to: `/agenda/${slug}`,
      matches: (p) =>
        p.startsWith(`/agenda/${slug}`) || p.startsWith(`/attendance/`),
    },
    {
      label: "Participants",
      icon: Users,
      to: `/networking/${slug}`,
      matches: (p) => p.startsWith(`/networking/${slug}`),
    },
    {
      label: "Infos pratiques",
      icon: Info,
      to: `/salon/${slug}`,
      matches: (p) => p.startsWith(`/salon/${slug}`),
    },
    {
      label: "Mon Profil",
      icon: User,
      to: `/me/${slug}`,
      matches: (p) => p.startsWith(`/me/${slug}`),
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

