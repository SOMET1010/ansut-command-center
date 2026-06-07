import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  Vote,
  Users,
  LogOut,
  ShieldCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnsutLogo } from "@/components/ansut/Logo";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

type NavTo = "/dashboard" | "/events" | "/participants" | "/polls" | "/checkin" | "/admin/setup";
type NavItem = { to: NavTo; label: string; icon: ComponentType<{ className?: string }> };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Pilotage",
    items: [{ to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    label: "Modules métier",
    items: [
      { to: "/events", label: "Événements", icon: Calendar },
      { to: "/participants", label: "Participants", icon: Users },
      { to: "/polls", label: "Live Polling", icon: Vote },
    ],
  },
  {
    label: "Exécution",
    items: [
      { to: "/checkin", label: "Check-in", icon: QrCode },
      { to: "/admin/setup", label: "Administration", icon: ShieldCheck },
    ],
  },
];

function AuthLayout() {
  const { isAuthenticated, loading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("ansut-sidebar-collapsed") === "1";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ansut-sidebar-collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login" });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center text-white/80"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        Chargement…
      </div>
    );
  }

  const currentLabel =
    NAV_SECTIONS.flatMap((s) => s.items).find((i) => pathname.startsWith(i.to))?.label ??
    "Console";

  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "sidebar-glass relative hidden flex-col text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {/* Brand */}
        <div className={cn("flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3", collapsed && "justify-center px-0")}>
          <AnsutLogo size={collapsed ? "sm" : "md"} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-sm font-bold">ANSUT EVENT</div>
              <div className="truncate text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/55">
                Console DG · SUTEL 2026
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              {!collapsed && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors",
                          collapsed && "justify-center",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-secondary" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-2 rounded-md bg-sidebar-accent/50 p-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-[11px] font-bold text-secondary">
                {(user?.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold text-sidebar-foreground">
                  {user?.email}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-sidebar-foreground/55">
                  Direction Générale
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed ? "justify-center px-0" : "justify-start",
            )}
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="mt-1 flex w-full items-center justify-center rounded-md py-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            aria-label={collapsed ? "Étendre la barre latérale" : "Réduire la barre latérale"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TopBar */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5 text-xs">
            <Link to="/dashboard" className="shrink-0" aria-label="Accueil console ANSUT EVENT">
              <AnsutLogo size="sm" />
            </Link>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 sm:inline">
              ANSUT EVENT
            </span>
            <span className="hidden text-muted-foreground/30 sm:inline">·</span>
            <Link
              to="/dashboard"
              className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Console
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="truncate font-semibold text-foreground">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/">Site public</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="page-max-width content-padding py-4 md:py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
