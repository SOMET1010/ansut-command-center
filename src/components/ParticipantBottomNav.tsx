import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, Users, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lot 1 — Navigation Participant (Phase 4.1).
 * 5 entrées strictes ("règle des 5 boutons"), vocabulaire "app de salon"
 * (Whova / Eventee / Brella / Swapcard).
 *
 * Mapping vers les routes existantes (aucun écran modifié) :
 *   Accueil      → /e/$slug
 *   Programme    → /agenda/$slug          (regroupe live & attendance)
 *   Participants → /networking/$slug      (regroupe networking · matchmaking · rdv · messages)
 *   Salon        → /annonces/$slug        (regroupe annonces · polls)
 *   Mon Profil   → /me/role
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
        p.startsWith(`/agenda/${slug}`) ||
        p.startsWith(`/live/`) ||
        p.startsWith(`/attendance/`),
    },
    {
      label: "Participants",
      icon: Users,
      to: `/networking/${slug}`,
      matches: (p) =>
        p.startsWith(`/networking/${slug}`) ||
        p.startsWith(`/matchmaking/${slug}`) ||
        p.startsWith(`/rdv/${slug}`) ||
        p.startsWith(`/messages/${slug}`),
    },
    {
      label: "Salon",
      icon: MessageSquare,
      to: `/annonces/${slug}`,
      matches: (p) =>
        p.startsWith(`/annonces/${slug}`) || p.startsWith(`/poll/`),
    },
    {
      label: "Mon Profil",
      icon: User,
      to: `/me/${slug}`,
      matches: (p) => p.startsWith(`/me/${slug}`) || p === "/me/role",
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
