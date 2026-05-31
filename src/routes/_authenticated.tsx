import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Calendar, QrCode, Vote, Users, LogOut, ShieldCheck, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/events", label: "Événements", icon: Calendar },
  { to: "/checkin", label: "Check-in", icon: QrCode },
  { to: "/polls", label: "Live Polling", icon: Vote },
  { to: "/participants", label: "Participants", icon: Users },
  { to: "/admin/setup", label: "Administration", icon: ShieldCheck },
];

function AuthLayout() {
  const { isAuthenticated, loading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login" });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-white/70"
        style={{ background: "var(--gradient-hero)" }}
      >
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary/40">
      {/* SIDEBAR */}
      <aside
        className="hidden w-72 flex-col text-white md:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-xl font-bold text-accent-foreground shadow-lg">
            A
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold tracking-tight">ANSUT EVENT</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              SUTEL 2026 Console
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Navigation
          </p>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-accent" : "text-white/50 group-hover:text-white"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
              {(user?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">{user?.email}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50">Connecté</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
          >
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/80 px-6 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            SUTEL 2026 • Plateforme officielle
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/">Retour au site</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
