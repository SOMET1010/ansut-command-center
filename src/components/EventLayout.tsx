import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  CalendarDays,
  Users,
  MessageSquare,
  Megaphone,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EventLayoutContext } from "@/contexts/event-layout";

interface EventLayoutProps {
  eventId: string;
  eventName: string;
  slug: string;
  qrToken: string | null;
  children: React.ReactNode;
}

const items = [
  { label: "Accueil", icon: Home, to: (slug: string) => `/e/${slug}` },
  { label: "Agenda", icon: CalendarDays, to: (slug: string) => `/e/${slug}/agenda` },
  { label: "Annuaire", icon: Users, to: (slug: string) => `/e/${slug}/reseau` },
  { label: "Infos pratiques", icon: MessageSquare, to: (slug: string) => `/e/${slug}/annonces` },
  { label: "Mon profil", icon: User, to: (slug: string) => `/e/${slug}/profil` },
];

export function EventLayout({ eventId, eventName, slug, qrToken, children }: EventLayoutProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "5rem";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, []);

  return (
    <EventLayoutContext.Provider value={{ eventId, eventName, slug, qrToken }}>
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        aria-label="Navigation participant"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {items.map((it) => {
            const to = it.to(slug);
            const active = pathname === to || pathname.startsWith(to + "/");
            const Icon = it.icon;
            return (
              <li key={it.label}>
                <Link
                  to={to}
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
    </EventLayoutContext.Provider>
  );
}