import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Users, QrCode, Vote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    { label: "Événements", value: eventsCount ?? "—", icon: Calendar },
    { label: "Participants", value: "—", icon: Users },
    { label: "Check-ins", value: "—", icon: QrCode },
    { label: "Sondages actifs", value: "—", icon: Vote },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="mt-1 text-muted-foreground">Vue d'ensemble de votre activité événementielle.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <h2 className="text-lg font-semibold">Bienvenue sur ANSUT EVENT</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 1 (fondations) livrée. Les modules événements, inscriptions, badges QR, live polling
          et notifications arrivent dans les phases suivantes.
        </p>
      </div>
    </div>
  );
}
