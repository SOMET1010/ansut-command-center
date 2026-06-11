import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Users, Building2, Calendar, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/lib/supabase";

export const Route = createFileRoute("/admin/overview")({
  head: () => ({ meta: [{ title: "Tableau de bord — ANSUT EVENT" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: async () => {
      const [orgs, users, events, registrations] = await Promise.all([
        supabaseAdmin.from("organizations").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("user_roles").select("user_id", { count: "exact", head: true }),
        supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("event_registrations").select("id", { count: "exact", head: true }),
      ]);
      return {
        organizations: orgs.count ?? 0,
        users: users.count ?? 0,
        events: events.count ?? 0,
        registrations: registrations.count ?? 0,
      };
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble multi-organisations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Organisations", value: stats?.organizations ?? 0, icon: Building2 },
          { label: "Utilisateurs", value: stats?.users ?? 0, icon: Users },
          { label: "Événements", value: stats?.events ?? 0, icon: Calendar },
          { label: "Inscriptions", value: stats?.registrations ?? 0, icon: Activity },
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-2">
            <a href="/admin/users" className="block rounded-lg border p-3 hover:bg-slate-50 text-sm font-medium">
              → Gestion des utilisateurs & rôles
            </a>
            <a href="/admin/security" className="block rounded-lg border p-3 hover:bg-slate-50 text-sm font-medium">
              → Audit de sécurité
            </a>
            <a href="/admin/bootstrap" className="block rounded-lg border p-3 hover:bg-slate-50 text-sm font-medium">
              → Bootstrap & configuration
            </a>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Dernières connexions</h2>
          <p className="text-sm text-muted-foreground">Voir le journal d'audit →</p>
          <a href="/admin/audit" className="mt-2 inline-flex items-center text-sm text-primary hover:underline">
            Accéder à l'audit trail →
          </a>
        </div>
      </div>
    </div>
  );
}