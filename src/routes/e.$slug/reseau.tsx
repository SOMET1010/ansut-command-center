import { createFileRoute } from "@tanstack/react-router";
import { EventLayout } from "@/components/EventLayout";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Users, MessageSquare, CalendarClock, User } from "lucide-react";
import { getParticipantToken } from "@/lib/token";

export const Route = createFileRoute("/e/$slug/reseau")({
  head: () => ({ meta: [{ title: "Annuaire participants — SUTEL 2026 | ANSUT EVENT" }] }),
  component: ReseauPage,
});

type Participant = {
  id: string;
  full_name: string;
  organization: string | null;
  position: string | null;
  country: string | null;
  bio: string | null;
  photo_url: string | null;
  interests: string[] | null;
  participant_category: string;
  linkedin_url: string | null;
};

const CATEGORIES: Record<string, string> = {
  all: "Tous",
  fsu: "Fonds de Service Universel",
  regulator: "Régulateur",
  operator: "Opérateur télécom",
  partner: "Partenaire financier",
  startup: "Startup / Innovation",
  international_org: "Organisation internationale",
  government: "Gouvernement",
  other: "Autre",
};

function ComingSoonPanel({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div className="mt-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        Disponible prochainement
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ReseauPage() {
  const { slug } = Route.useParams();
  const [token] = useState(() => getParticipantToken(slug));

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event-reseau", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, slug, starts_at, location")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (eventLoading) {
    return (
      <EventLayout eventId="" eventName="" slug={slug} qrToken={null}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Chargement de l'annuaire…</p>
        </div>
      </EventLayout>
    );
  }

  if (!event) {
    return (
      <EventLayout eventId="" eventName="" slug={slug} qrToken={null}>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold">Événement indisponible</h1>
          <p className="text-muted-foreground">Cet événement n'existe pas ou n'est pas encore publié.</p>
        </div>
      </EventLayout>
    );
  }

  return (
    <EventLayout eventId={event.id} eventName={event.name} slug={slug} qrToken={token}>
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold">Réseau &amp; rencontres</h1>
          <p className="text-sm text-muted-foreground">Annuaire · Messages · Rendez-vous</p>
        </div>

        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="discover" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Découvrir</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Messages</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Rendez-vous</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6">
            <DiscoverTab slug={slug} />
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <ComingSoonPanel
              icon={MessageSquare}
              title="Messages"
              description="Cette fonctionnalité sera activée pour les prochains événements. Vous pourrez échanger directement avec les participants rencontrés."
            />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <ComingSoonPanel
              icon={CalendarClock}
              title="Rendez-vous"
              description="Cette fonctionnalité sera activée pour les prochains événements. Vous pourrez proposer et gérer des rendez-vous individuels."
            />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t border-slate-200 mt-8 -mx-4 px-4 py-4 text-center text-xs text-muted-foreground">
        Plateforme événementielle ANSUT — Données personnelles affichées avec le consentement des participants
      </footer>
    </EventLayout>
  );
}

/* ─── Onglet Découvrir ─── */
function DiscoverTab({ slug }: { slug: string }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["directory-participants", slug, categoryFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_event_networking", {
        p_slug: slug,
        p_category: categoryFilter === "all" ? undefined : categoryFilter,
      });
      if (error) throw error;
      return (data ?? []) as Participant[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase();
    return participants.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.organization && p.organization.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q)) ||
        (p.position && p.position.toLowerCase().includes(q)),
    );
  }, [participants, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher par nom, organisation ou pays..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === key
                ? "bg-primary text-white"
                : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search ? "Aucun participant ne correspond à votre recherche." : "Aucun participant inscrit pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} participant{filtered.length > 1 ? "s" : ""}
            {categoryFilter !== "all" && ` dans « ${CATEGORIES[categoryFilter]} »`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.full_name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      p.full_name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{p.full_name}</h3>
                    {p.position && <p className="text-xs text-muted-foreground truncate">{p.position}</p>}
                    {p.organization && <p className="text-xs text-muted-foreground truncate">{p.organization}</p>}
                  </div>
                </div>
                {p.bio && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.bio}</p>}
                {p.linkedin_url && (
                  <a
                    href={p.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Profil LinkedIn de ${p.full_name}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    LinkedIn →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}