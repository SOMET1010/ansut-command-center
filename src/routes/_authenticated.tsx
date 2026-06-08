import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  Vote,
  Users,
  LogOut,
  ShieldCheck,
  Bell,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnsutLogo } from "@/components/ansut/Logo";
import { supabase } from "@/integrations/supabase/client";
import {
  COCKPIT_VISIBLE_NAV_SECTIONS,
  getCockpitBreadcrumbChain,
  getCockpitParentTarget,
  type CockpitNavTo,
} from "@/lib/cockpit-nav";

export const Route = createFileRoute("/_authenticated")({
  // Supabase session vit dans localStorage : on désactive le SSR pour ce
  // sous-arbre et on gate avec un beforeLoad côté client.
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

type IconCmp = ComponentType<{ className?: string }>;
type NavItem = { to: CockpitNavTo; label: string; icon: IconCmp };
type NavSection = { label: string; items: NavItem[] };

const ICONS: Record<CockpitNavTo, IconCmp> = {
  "/dashboard": LayoutDashboard,
  "/events": Calendar,
  "/participants": Users,
  "/polls": Vote,
  "/announcements": Megaphone,
  "/checkin": QrCode,
  "/admin/setup": ShieldCheck,
};

// Matrice rôle → entrées visibles dans la sidebar.
const NAV_ALLOWED_ROLES: Record<CockpitNavTo, AppRole[] | "all"> = {
  "/dashboard": "all",
  "/events": ["super_admin", "org_admin", "staff"],
  "/participants": ["super_admin", "org_admin", "staff"],
  "/polls": ["super_admin", "org_admin"],
  "/announcements": ["super_admin", "org_admin"],
  "/checkin": ["super_admin", "org_admin", "staff"],
  "/admin/setup": ["super_admin"],
};

const ALL_NAV_SECTIONS: NavSection[] = COCKPIT_VISIBLE_NAV_SECTIONS.map((s) => ({
  label: s.label,
  items: s.items.map((i) => ({ to: i.to, label: i.label, icon: ICONS[i.to] })),
}));

function AuthLayout() {
  const { isAuthenticated, loading, user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("ansut-sidebar-collapsed") === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filtre la sidebar selon les rôles de l'utilisateur courant.
  const NAV_SECTIONS = useMemo<NavSection[]>(() => {
    return ALL_NAV_SECTIONS.map((s) => ({
      label: s.label,
      items: s.items.filter((i) => {
        const allowed = NAV_ALLOWED_ROLES[i.to];
        if (allowed === "all") return true;
        return roles.some((r) => allowed.includes(r));
      }),
    })).filter((s) => s.items.length > 0);
  }, [roles]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ansut-sidebar-collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  // Fermer le menu mobile quand on navigue
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login" });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center text-white/80"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  const crumbs = getCockpitBreadcrumbChain(pathname);
  const parentTarget = getCockpitParentTarget(pathname);
  // M-03: active state — exact match OR nested under the route ("/" boundary).
  const isActive = (to: CockpitNavTo) =>
    pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR — Desktop + Mobile drawer */}
      <aside
        className={cn(
          "sidebar-glass fixed inset-y-0 left-0 z-50 flex flex-col text-sidebar-foreground transition-transform duration-200 md:relative md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-60",
          mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3",
            collapsed && "md:justify-center md:px-0",
          )}
        >
          <AnsutLogo size={collapsed ? "sm" : "md"} />
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate font-display text-sm font-bold">ANSUT EVENT</div>
              <div className="truncate text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/55">
                Console DG · SUTEL 2026
              </div>
            </div>
          )}
          {/* Close button mobile */}
          <button
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              {(!collapsed || mobileOpen) && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={collapsed && !mobileOpen ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition-colors",
                          collapsed && !mobileOpen && "justify-center",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-secondary" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        {(!collapsed || mobileOpen) && (
                          <span className="truncate">{item.label}</span>
                        )}
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
          {(!collapsed || mobileOpen) && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-sidebar-accent/50 p-2">
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
              collapsed && !mobileOpen ? "justify-center px-0" : "justify-start",
            )}
            onClick={() => signOut().then(() => navigate({ to: "/login" }))}
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || mobileOpen) && <span className="ml-2">Déconnexion</span>}
          </Button>
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="mt-1 hidden w-full items-center justify-center rounded-md py-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground md:flex"
            aria-label={collapsed ? "Étendre la barre latérale" : "Réduire la barre latérale"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TopBar */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-card/85 px-3 backdrop-blur-md md:px-4">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            {/* Hamburger mobile */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-accent md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* M-02 Contextual back button — only when we are deep under a primary route */}
            {parentTarget && (
              <Link
                to={parentTarget as CockpitNavTo}
                className="hidden h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
                aria-label="Retour"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour
              </Link>
            )}
            <Link
              to="/dashboard"
              className="hidden shrink-0 md:block"
              aria-label="Accueil console ANSUT EVENT"
            >
              <AnsutLogo size="sm" />
            </Link>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 sm:inline">
              ANSUT EVENT
            </span>
            <span className="hidden text-muted-foreground/30 sm:inline">·</span>
            {/* M-01 Breadcrumb chain — supports deep nested routes */}
            <nav
              aria-label="Fil d'Ariane"
              className="flex min-w-0 items-center gap-1 overflow-hidden"
            >
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                    {i > 0 && (
                      <span className="text-muted-foreground/40" aria-hidden="true">
                        /
                      </span>
                    )}
                    {c.to && !isLast ? (
                      <Link
                        to={c.to as CockpitNavTo}
                        className="truncate font-semibold text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span
                        className="truncate font-semibold text-foreground"
                        aria-current={isLast ? "page" : undefined}
                      >
                        {c.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden h-8 text-xs sm:inline-flex">
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
