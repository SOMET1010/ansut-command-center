import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Users, QrCode, Vote, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

  const stats = [
    { label: "Événements", value: eventsCount ?? "—", icon: Calendar, hint: "Au catalogue" },
    { label: "Participants", value: "—", icon: Users, hint: "Inscrits" },
    { label: "Check-ins", value: "—", icon: QrCode, hint: "Badges scannés" },
    { label: "Sondages", value: "—", icon: Vote, hint: "Actifs" },
  ];

  return (
    <div className="min-h-full bg-secondary/40">
      {/* HERO HEADER */}
      <div
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -right-24 top-0 h-[400px] w-[400px] rounded-full bg-accent/25 blur-[120px]" />
        <div className="relative px-8 py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1">
            <Sparkles className="h-3 w-3 text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
              SUTEL 2026 • Console
            </span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">
            Tableau de bord
          </h1>
          <p className="mt-2 max-w-xl text-white/70">
            Vue d'ensemble de votre activité événementielle en temps réel.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="-mt-8 px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 font-display text-3xl font-extrabold text-foreground">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-8 grid gap-4 px-8 pb-12 lg:grid-cols-3">
        <QuickAction
          to="/events"
          icon={Calendar}
          title="Gérer les événements"
          desc="Créez et organisez vos conférences SUTEL 2026."
        />
        <QuickAction
          to="/participants"
          icon={Users}
          title="Suivre les participants"
          desc="Validez les inscriptions et exportez les listes."
        />
        <QuickAction
          to="/checkin"
          icon={QrCode}
          title="Check-in & badges"
          desc="Scannez les badges QR en temps réel."
        />
      </div>
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
    <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/30 hover:shadow-[var(--shadow-card)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Button
        asChild
        variant="ghost"
        className="mt-4 -ml-3 text-accent hover:bg-accent/10 hover:text-accent"
      >
        <Link to={to}>
          Ouvrir
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  );
}
