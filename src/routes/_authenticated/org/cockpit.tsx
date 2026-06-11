import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Users, QrCode, CheckCircle2, ArrowRight, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/org/cockpit")({
  head: () => ({ meta: [{ title: "Tableau de bord — ANSUT EVENT" }] }),
  component: OrgCockpit,
});

type EventRow = { id: string; name: string; starts_at: string; capacity: number | null; status: string };
type RegRow = { id: string; full_name: string; email: string; status: string; checked_in_at: string | null; event_id: string };

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function OrgCockpit() {
  const { roles } = useAuth();

  const { data: events = [] } = useQuery({
    queryKey: ["org-cockpit-events"],
    queryFn: async () => {
      const orgFilter = roles.includes("super_admin") ? {} : {};
      const { data, error } = await supabase
        .from("events")
        .select("id, name, starts_at, capacity, status")
        .in("status", ["published", "draft"])
        .order("starts_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const { data: recentRegs = [] } = useQuery({
    queryKey: ["org-cockpit-recent-regs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, full_name, email, status, checked_in_at, event_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as RegRow[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["org-cockpit-stats"],
    queryFn: async () => {
      const [totalRegs, checkedIn, upcomingEvents] = await Promise.all([
        supabase.from("event_registrations").select("id", { count: "exact", head: true }),
        supabase.from("event_registrations").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);
      return {
        registrations: totalRegs.count ?? 0,
        checkedIn: checkedIn.count ?? 0,
        events: upcomingEvents.count ?? 0,
      };
    },
  });

  const upcomingEvents = events.filter((e) => new Date(e.starts_at) >= new Date()).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de vos événements</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Événements actifs", value: stats?.events ?? 0, icon: Calendar },
          { label: "Inscriptions", value: stats?.registrations ?? 0, icon: Users },
          { label: "Check-ins", value: stats?.checkedIn ?? 0, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <a href="/org/events" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-slate-50 shadow-sm">
          <CalendarPlus className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Programme</p>
            <p className="text-xs text-muted-foreground">Gérer les événements</p>
          </div>
        </a>
        <a href="/checkin" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-slate-50 shadow-sm">
          <QrCode className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Check-in</p>
            <p className="text-xs text-muted-foreground">Scanner les badges</p>
          </div>
        </a>
        <a href="/org/participants" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-slate-50 shadow-sm">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Participants</p>
            <p className="text-xs text-muted-foreground">Voir les inscriptions</p>
          </div>
        </a>
        <a href="/org/exports" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-slate-50 shadow-sm">
          <ArrowRight className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Exports</p>
            <p className="text-xs text-muted-foreground">Télécharger les données</p>
          </div>
        </a>
      </div>

      {/* Événements à venir */}
      {upcomingEvents.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Événements à venir</h2>
            <a href="/org/events" className="text-sm text-primary hover:underline">Voir tout →</a>
          </div>
          <div className="divide-y">
            {upcomingEvents.map((ev) => {
              const days = daysUntil(ev.starts_at);
              return (
                <div key={ev.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-sm">{ev.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(ev.starts_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    days < 0 ? "bg-red-100 text-red-700" :
                    days === 0 ? "bg-green-100 text-green-700" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {days < 0 ? "Passé" : days === 0 ? "Aujourd'hui" : `J-${days}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dernières inscriptions */}
      {recentRegs.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Dernières inscriptions</h2>
            <a href="/org/participants" className="text-sm text-primary hover:underline">Voir tout →</a>
          </div>
          <div className="divide-y">
            {recentRegs.map((reg) => (
              <div key={reg.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{reg.full_name}</p>
                  <p className="text-xs text-muted-foreground">{reg.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  reg.checked_in_at ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {reg.checked_in_at ? "Check-in ✅" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}