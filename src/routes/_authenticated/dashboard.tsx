import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Users,
  QrCode,
  Vote,
  ArrowRight,
  CalendarPlus,
  Download,
  Clock,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExecHero } from "@/components/ansut/ExecHero";
import { KPICard } from "@/components/ansut/KPICard";
import { SectionGrid } from "@/components/ansut/SectionGrid";
import { AlertBanner } from "@/components/ansut/AlertBanner";
import { AnsutLogo } from "@/components/ansut/Logo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — ANSUT EVENT" }] }),
  component: Dashboard,
});

/* ─── Types ─── */
type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  capacity: number | null;
  status: string;
};

type RegistrationRow = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  checked_in_at: string | null;
  event_id: string;
};

/* ─── Helpers ─── */
function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function computeMasteryIndex(params: {
  eventsCount: number;
  publishedCount: number;
  registrationsCount: number;
  totalCapacity: number;
  checkinsCount: number;
  hasRecentActivity: boolean;
}): number {
  const {
    eventsCount,
    publishedCount,
    registrationsCount,
    totalCapacity,
    checkinsCount,
    hasRecentActivity,
  } = params;

  // Couverture événementielle (20%)
  const coverageScore = eventsCount > 0 ? (publishedCount / eventsCount) * 100 : 0;

  // Taux de remplissage (30%)
  const fillRate =
    totalCapacity > 0 ? Math.min((registrationsCount / totalCapacity) * 100, 100) : 0;

  // Taux de check-in (30%)
  const checkinRate = registrationsCount > 0 ? (checkinsCount / registrationsCount) * 100 : 0;

  // Fraîcheur des données (20%)
  const freshnessScore = hasRecentActivity ? 100 : 30;

  const index = coverageScore * 0.2 + fillRate * 0.3 + checkinRate * 0.3 + freshnessScore * 0.2;
  return Math.round(index * 10) / 10;
}

function getMasteryLevel(index: number): "ok" | "warning" | "critical" {
  if (index >= 65) return "ok";
  if (index >= 40) return "warning";
  return "critical";
}

/* ─── Dashboard ─── */
function Dashboard() {
  // Requête : tous les événements
  const { data: events = [] } = useQuery({
    queryKey: ["dashboard", "events-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, starts_at, capacity, status")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
    staleTime: 30_000,
  });

  // Requête : toutes les inscriptions
  const { data: registrations = [] } = useQuery({
    queryKey: ["dashboard", "registrations-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, full_name, email, status, created_at, checked_in_at, event_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RegistrationRow[];
    },
    staleTime: 30_000,
  });

  // Métriques calculées
  const eventsCount = events.length;
  const publishedCount = events.filter((e) => e.status === "published").length;
  const registrationsCount = registrations.length;
  const checkinsCount = registrations.filter((r) => r.checked_in_at).length;
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity ?? 0), 0);

  // Fraîcheur : activité dans les dernières 24h
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hasRecentActivity = registrations.some((r) => new Date(r.created_at) > oneDayAgo);

  // Indice de maîtrise dynamique
  const masteryIndex = computeMasteryIndex({
    eventsCount,
    publishedCount,
    registrationsCount,
    totalCapacity,
    checkinsCount,
    hasRecentActivity,
  });
  const masteryLevel = getMasteryLevel(masteryIndex);

  // Prochain événement (J-X)
  const nextEvent = events.find((e) => e.status === "published" && new Date(e.starts_at) > now);
  const daysToNext = nextEvent ? daysUntil(nextEvent.starts_at) : null;

  // AlertBanner conditionnel : événement proche avec remplissage > 70%
  const alertEvent = events.find((e) => {
    if (e.status !== "published" || !e.capacity) return false;
    const days = daysUntil(e.starts_at);
    if (days < 0 || days > 30) return false;
    const regsForEvent = registrations.filter((r) => r.event_id === e.id).length;
    return regsForEvent / e.capacity >= 0.7;
  });
  const alertFillPercent = alertEvent?.capacity
    ? Math.round(
        (registrations.filter((r) => r.event_id === alertEvent.id).length / alertEvent.capacity) *
          100,
      )
    : 0;

  // Timeline : 5 dernières activités
  const recentActivity = registrations.slice(0, 5);

  return (
    <div className="section-gap">
      {/* ZONE 1 — Hero + KPI satellites + Compteur J-X */}
      <ExecHero
        eyebrow={nextEvent ? `${nextEvent.name} · J-${daysToNext}` : "ANSUT EVENT · Console DG"}
        title="Tableau de bord"
        subtitle="Vue d'ensemble de l'activité événementielle ANSUT en temps réel."
        primaryLabel="Indice de maîtrise"
        primaryValue={String(masteryIndex).replace(".", ",")}
        primaryHint="Sur 100 — Calculé dynamiquement"
        primaryLevel={masteryLevel}
        satellites={[
          { label: "Événements", value: eventsCount, hint: "Au catalogue" },
          { label: "Participants", value: registrationsCount, hint: "Inscrits validés" },
          { label: "Check-ins", value: checkinsCount, hint: "Badges scannés" },
          { label: "Sondages", value: "—", hint: "Phase 2" },
        ]}
      />

      {/* Compteur J-X prochain événement */}
      {nextEvent && daysToNext !== null && (
        <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{nextEvent.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(nextEvent.starts_at).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold tabular-nums text-primary">J-{daysToNext}</span>
            <p className="text-[11px] text-muted-foreground">
              {daysToNext <= 7 ? "Imminent" : "À venir"}
            </p>
          </div>
        </div>
      )}

      {/* ZONE 2 — AlertBanner conditionnel */}
      {alertEvent && (
        <AlertBanner
          level={alertFillPercent >= 90 ? "critical" : "warning"}
          title="Vigilance capacité"
        >
          <strong>{alertEvent.name}</strong> est rempli à {alertFillPercent} % de sa capacité (
          {registrations.filter((r) => r.event_id === alertEvent.id).length}/{alertEvent.capacity}{" "}
          inscrits).
          {alertFillPercent >= 90
            ? " Capacité quasi atteinte — arbitrage nécessaire."
            : " Anticiper l'arbitrage des accréditations si besoin."}
        </AlertBanner>
      )}

      {/* Indicateurs opérationnels */}
      <SectionGrid title="Indicateurs opérationnels" cols={4} withLogo logoSuffix="ANSUT EVENT">
        <KPICard
          label="Événements"
          value={eventsCount}
          hint={`${publishedCount} publiés`}
          icon={Calendar}
        />
        <KPICard
          label="Participants"
          value={registrationsCount}
          hint="Inscriptions totales"
          icon={Users}
        />
        <KPICard
          label="Check-ins"
          value={checkinsCount}
          hint={
            registrationsCount > 0
              ? `${Math.round((checkinsCount / registrationsCount) * 100)} % de présence`
              : "Aucun scan"
          }
          icon={QrCode}
        />
        <KPICard label="Sondages" value="—" hint="Phase 2" icon={Vote} />
      </SectionGrid>

      {/* Actions rapides orientées tâche */}
      <SectionGrid title="Actions rapides" cols={3} withLogo logoSuffix="Console DG">
        <QuickAction
          to={eventsCount === 0 ? "/events/new" : "/events"}
          icon={eventsCount === 0 ? CalendarPlus : Calendar}
          title={eventsCount === 0 ? "Créer un événement" : "Gérer les événements"}
          desc={
            eventsCount === 0
              ? "Aucun événement — créez le premier."
              : `${publishedCount} événement${publishedCount > 1 ? "s" : ""} actif${publishedCount > 1 ? "s" : ""} au catalogue.`
          }
        />
        <QuickAction
          to="/checkin"
          icon={QrCode}
          title="Ouvrir le scanner"
          desc="Scan QR temps réel et contrôle d'accès."
        />
        <QuickAction
          to="/exports"
          icon={Download}
          title="Exporter les données"
          desc="Accéder aux listes de participants et exports CSV."
        />
      </SectionGrid>

      {/* Timeline d'activité récente */}
      {recentActivity.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">
              Activité récente
            </h2>
            <Link to="/events" className="text-xs font-medium text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="card-elevated divide-y divide-border rounded-xl border border-border bg-card">
            {recentActivity.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.checked_in_at ? "bg-signal-ok/10" : "bg-primary/10"}`}
                >
                  {r.checked_in_at ? (
                    <UserCheck className="h-3.5 w-3.5 text-signal-ok" />
                  ) : (
                    <Users className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{r.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.checked_in_at ? "Check-in effectué" : "Inscription"} —{" "}
                    {new Date(r.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.checked_in_at ? "bg-signal-ok/10 text-signal-ok" : "bg-primary/10 text-primary"}`}
                >
                  {r.checked_in_at ? "Présent" : "Inscrit"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: typeof Calendar;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="card-elevated card-elevated-hover group relative flex flex-col rounded-lg border border-border bg-card p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="absolute right-3 top-3 opacity-80 transition-opacity group-hover:opacity-100">
        <AnsutLogo size="sm" />
      </div>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 flex-1 text-xs text-muted-foreground">{desc}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-all group-hover:gap-2">
        Ouvrir
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
