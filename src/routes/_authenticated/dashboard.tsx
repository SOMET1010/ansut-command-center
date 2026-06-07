import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Users, QrCode, Vote, ArrowRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExecHero } from "@/components/ansut/ExecHero";
import { KPICard } from "@/components/ansut/KPICard";
import { SectionGrid } from "@/components/ansut/SectionGrid";
import { SutaPanel } from "@/components/ansut/SutaPanel";
import { AlertBanner } from "@/components/ansut/AlertBanner";
import { AnsutLogo } from "@/components/ansut/Logo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — ANSUT EVENT" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [eventsCount, setEventsCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => setEventsCount(count ?? 0));
  }, []);

  return (
    <div className="section-gap">
      {/* ZONE 1 — Hero + KPI satellites */}
      <ExecHero
        eyebrow="SUTEL 2026 · Console DG"
        title="Tableau de bord"
        subtitle="Vue d'ensemble de l'activité événementielle ANSUT en temps réel."
        primaryLabel="Indice de maîtrise"
        primaryValue="87,4"
        primaryHint="Sur 100 — Pilotage opérationnel SUTEL 2026"
        primaryLevel="ok"
        satellites={[
          { label: "Événements", value: eventsCount ?? "—", hint: "Au catalogue" },
          { label: "Participants", value: "—", hint: "Inscrits validés" },
          { label: "Check-ins", value: "—", hint: "Badges scannés" },
          { label: "Sondages", value: "—", hint: "Actifs" },
        ]}
      />

      {/* ZONE 2 — Analyse détaillée */}
      <AlertBanner level="warning" title="Vigilance accréditations">
        Capacité atteinte à 78 % pour la séance plénière du J1. Anticiper l'arbitrage des
        accréditations VIP avant J-7.
      </AlertBanner>

      <SectionGrid title="Indicateurs opérationnels" cols={4} withLogo logoSuffix="SUTEL 2026 · ANSUT">
        <KPICard
          label="Événements"
          value={eventsCount ?? "—"}
          hint="Catalogue"
          icon={Calendar}
        />
        <KPICard
          label="Participants"
          value="—"
          hint="Inscriptions validées"
          icon={Users}
        />
        <KPICard
          label="Check-ins"
          value="—"
          hint="Présence J réel"
          icon={QrCode}
        />
        <KPICard
          label="Sondages"
          value="—"
          hint="Engagement live"
          icon={Vote}
        />
      </SectionGrid>

      <SectionGrid title="Actions Direction" cols={3} withLogo logoSuffix="Console DG">
        <QuickAction
          to="/events"
          icon={Calendar}
          title="Gérer les événements"
          desc="Catalogue, conférences et arbitrages programmatiques."
        />
        <QuickAction
          to="/participants"
          icon={Users}
          title="Suivre les participants"
          desc="Validation des inscriptions et exports DG."
        />
        <QuickAction
          to="/checkin"
          icon={QrCode}
          title="Check-in & badges"
          desc="Scan QR temps réel et contrôle d'accès."
        />
      </SectionGrid>

      {/* ZONE 3 — IA SUTA */}
      <SutaPanel subtitle="Mise à jour il y a quelques minutes">
        <p>
          L'IA SUTA détecte un <strong>déséquilibre régional</strong> dans les inscriptions :
          83 % proviennent du district d'Abidjan. Sans relance ciblée des directions régionales
          d'ici J-21, l'objectif de représentativité nationale ne sera pas atteint.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ansut-orange" size="sm">
            Lancer la campagne régionale
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm">
            Voir l'analyse complète
          </Button>
        </div>
      </SutaPanel>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: "/events" | "/participants" | "/checkin";
  icon: typeof Calendar;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="card-elevated card-elevated-hover group flex flex-col rounded-lg border border-border bg-card p-4 transition-transform hover:-translate-y-0.5"
    >
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
