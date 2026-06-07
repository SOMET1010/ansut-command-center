import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Users, MapPin, Building2, Linkedin, User, MessageCircle } from "lucide-react";

/* ─── Types ─── */
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
  operator: "Opérateur",
  partner: "Partenaire financier",
  startup: "Startup / Innovation",
  international_org: "Organisation internationale",
  government: "Gouvernement",
  other: "Autre",
};

/* ─── Route ─── */
export const Route = createFileRoute("/networking/$slug")({
  component: NetworkingDirectory,
});

function NetworkingDirectory() {
  const { slug } = Route.useParams();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Charger l'événement par slug
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event-networking", slug],
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

  // Charger les participants visibles dans l'annuaire
  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ["directory-participants", event?.id, categoryFilter],
    queryFn: async () => {
      if (!event?.id) return [];
      let query = supabase
        .from("event_registrations")
        .select(
          "id, full_name, organization, position, country, bio, photo_url, interests, participant_category, linkedin_url"
        )
        .eq("event_id", event.id)
        .eq("is_visible_in_directory", true)
        .eq("status", "confirmed")
        .order("full_name", { ascending: true });

      if (categoryFilter !== "all") {
        query = query.eq("participant_category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Participant[];
    },
    enabled: !!event?.id,
  });

  // Filtrage local par recherche texte
  const filtered = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase();
    return participants.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.organization && p.organization.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q)) ||
        (p.position && p.position.toLowerCase().includes(q))
    );
  }, [participants, search]);

  // États de chargement et d'erreur
  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            Annuaire indisponible
          </h1>
          <p className="text-muted-foreground">
            Cet événement n'existe pas ou n'est pas encore publié.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-slate-800">
              Annuaire des participants
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            {event.name}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par nom, organisation ou pays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === key
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} participant{filtered.length > 1 ? "s" : ""}{" "}
          {categoryFilter !== "all" && `dans « ${CATEGORIES[categoryFilter]} »`}
        </p>

        {/* Liste des participants */}
        {participantsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search
                ? "Aucun participant ne correspond à votre recherche."
                : "Aucun participant inscrit pour le moment."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ParticipantCard key={p.id} participant={p} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Plateforme événementielle ANSUT — Données personnelles affichées avec le consentement des participants
        </div>
      </footer>
    </div>
  );
}

/* ─── Composant carte participant ─── */
function ParticipantCard({ participant: p }: { participant: Participant }) {
  const initials = p.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const categoryColors: Record<string, string> = {
    fsu: "bg-blue-100 text-blue-700",
    regulator: "bg-purple-100 text-purple-700",
    operator: "bg-orange-100 text-orange-700",
    partner: "bg-green-100 text-green-700",
    startup: "bg-pink-100 text-pink-700",
    international_org: "bg-cyan-100 text-cyan-700",
    government: "bg-amber-100 text-amber-700",
    other: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      {/* En-tête : avatar + nom */}
      <div className="flex items-start gap-3 mb-3">
        {p.photo_url ? (
          <img
            src={p.photo_url}
            alt={p.full_name}
            className="h-11 w-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">
              {initials}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">
            {p.full_name}
          </h3>
          {p.position && (
            <p className="text-xs text-muted-foreground truncate">
              {p.position}
            </p>
          )}
        </div>
      </div>

      {/* Organisation */}
      {p.organization && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{p.organization}</span>
        </div>
      )}

      {/* Pays */}
      {p.country && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{p.country}</span>
        </div>
      )}

      {/* Bio courte */}
      {p.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {p.bio}
        </p>
      )}

      {/* Tags intérêts */}
      {p.interests && p.interests.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {p.interests.slice(0, 3).map((interest) => (
            <span
              key={interest}
              className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 rounded-full"
            >
              {interest}
            </span>
          ))}
          {p.interests.length > 3 && (
            <span className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-500 rounded-full">
              +{p.interests.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Pied : catégorie + LinkedIn */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <span
          className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
            categoryColors[p.participant_category] || categoryColors.other
          }`}
        >
          {CATEGORIES[p.participant_category] || "Autre"}
        </span>
        {p.linkedin_url && (
          <a
            href={p.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
            aria-label={`Profil LinkedIn de ${p.full_name}`}
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
        <Link
          to={`/messages/${slug}?to=${p.id}`}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Contacter
        </Link>
      </div>
    </div>
  );
}
