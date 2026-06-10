import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IdCard,
  User as UserIcon,
  Bookmark,
  Clock,
  MapPin,
  Globe,
  LogOut,
  AlertCircle,
  Languages,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ParticipantBottomNav } from "@/components/ParticipantBottomNav";
import { MyBadgeCard } from "@/components/MyBadgeCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Profil participant (Sprint A — Phase 5).
 * Identité = qr_token (cohérent avec badge, programme, networking, RDV).
 * Aucune authentification Supabase requise.
 */
export const Route = createFileRoute("/me/$slug")({
  head: () => ({ meta: [{ title: "Mon profil — ANSUT EVENT" }] }),
  component: MyProfilePage,
});

type Me = {
  id: string;
  full_name: string;
  email: string | null;
  organization: string | null;
  job_position: string | null;
  country: string | null;
  bio: string | null;
  photo_url: string | null;
  participant_category: string | null;
  event_id: string;
  status: string | null;
};

// Aligné sur le référentiel d'inscription (src/routes/e.$slug.tsx ll.502-509
// et src/routes/networking.$slug.tsx CATEGORIES). Un participant inscrit
// comme "operator" doit voir "Opérateur télécom" sur son badge, pas un
// label badge déconnecté du formulaire d'inscription.
const CATEGORY_LABELS: Record<string, string> = {
  fsu: "Fonds de Service Universel",
  regulator: "Régulateur",
  operator: "Opérateur télécom",
  partner: "Partenaire financier",
  startup: "Startup / Innovation",
  international_org: "Organisation internationale",
  government: "Gouvernement",
  other: "Participant",
};

function MyProfilePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [token, setToken] = useState<string>("");

  // Token : ?token=... > localStorage canonique > legacy.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken && /^[0-9a-f-]{20,}$/i.test(urlToken)) {
      window.localStorage.setItem(`ansut:badge:${slug}`, urlToken);
      setToken(urlToken);
      return;
    }
    setToken(
      window.localStorage.getItem(`ansut:badge:${slug}`) ||
        window.localStorage.getItem("ansut_participant_token") ||
        "",
    );
  }, [slug]);

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me-profile", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("me_registration", { p_qr_token: token });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as Me | null;
    },
  });

  const { data: bookmarkIds = [] } = useQuery({
    queryKey: ["my-bookmark-ids", token, me?.event_id],
    enabled: !!token && !!me?.event_id,
    queryFn: async () => {
      const { data } = await supabase.rpc("list_my_bookmarks", {
        p_qr_token: token,
        p_event_id: me!.event_id,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((b) => b.session_id as string);
    },
  });

  const { data: favoriteSessions = [] } = useQuery({
    queryKey: ["my-favorite-sessions", bookmarkIds.join(",")],
    enabled: bookmarkIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_sessions")
        .select("id, title, starts_at, ends_at, location")
        .in("id", bookmarkIds)
        .order("starts_at", { ascending: true });
      return data ?? [];
    },
  });

  const initials = useMemo(() => {
    if (!me?.full_name) return "?";
    return me.full_name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [me?.full_name]);

  function disconnect() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(`ansut:badge:${slug}`);
    window.localStorage.removeItem("ansut_participant_token");
    if (token) window.localStorage.removeItem(`ansut:badge:data:${token}`);
    navigate({ to: "/e/$slug", params: { slug } });
  }

  // Pas de token : invitation à utiliser son badge.
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ParticipantBottomNav slug={slug} />
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border p-6 text-center">
            <IdCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-gray-900">Aucun badge sur cet appareil</h1>
            <p className="mt-2 text-sm text-gray-600">
              Pour accéder à votre profil, ouvrez le lien personnel reçu par email ou
              inscrivez-vous à l'événement.
            </p>
            <Button asChild className="mt-5 w-full">
              <Link to="/e/$slug" params={{ slug }}>
                M'inscrire à l'événement
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Token présent mais inconnu côté serveur (révoqué / mauvais évènement).
  if (!me) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ParticipantBottomNav slug={slug} />
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border p-6 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-gray-900">Badge introuvable</h1>
            <p className="mt-2 text-sm text-gray-600">
              Le badge enregistré sur cet appareil n'est pas reconnu. Il a peut-être été
              annulé ou appartient à un autre évènement.
            </p>
            <Button onClick={disconnect} variant="outline" className="mt-5 w-full">
              Effacer ce badge
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const category = me.participant_category
    ? CATEGORY_LABELS[me.participant_category] ?? me.participant_category
    : "Participant";

  return (
    <div className="min-h-screen bg-gray-50">
      <ParticipantBottomNav slug={slug} />

      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-gray-900">Mon profil</h1>
          </div>
          <LanguageSwitcher language={language} onLanguageChange={setLanguage} compact />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Identité */}
        <section className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
              {me.photo_url ? (
                <img src={me.photo_url} alt={me.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{me.full_name}</h2>
              {me.organization && (
                <p className="text-sm text-gray-600 truncate">{me.organization}</p>
              )}
              {me.job_position && (
                <p className="text-xs text-gray-500 truncate">{me.job_position}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {category}
                </span>
                {me.country && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700">
                    <Globe className="h-3 w-3" /> {me.country}
                  </span>
                )}
              </div>
            </div>
          </div>
          {me.bio && (
            <p className="mt-4 text-sm text-gray-700 leading-relaxed border-t pt-3">{me.bio}</p>
          )}
        </section>

        {/* Badge */}
        <MyBadgeCard qrToken={token} />

        {/* Favoris */}
        <section className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-ansut-orange" />
              Mes sessions favorites
            </h3>
            <Link
              to="/agenda/$slug"
              params={{ slug }}
              className="text-xs text-primary font-medium hover:underline"
            >
              Voir le programme →
            </Link>
          </div>
          {favoriteSessions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun favori pour l'instant. Marquez les sessions qui vous intéressent
              depuis le programme.
            </p>
          ) : (
            <ul className="space-y-2">
              {favoriteSessions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(s.starts_at).toLocaleString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {s.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {s.location}
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Paramètres */}
        <section className="bg-white rounded-2xl border p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Languages className="h-4 w-4 text-gray-500" />
            Paramètres
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Langue de l'application</span>
            <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
          </div>
          <button
            onClick={disconnect}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Me déconnecter de cet appareil
          </button>
          <p className="mt-2 text-[11px] text-gray-500 text-center">
            Votre badge reste valide. Vous pourrez vous reconnecter via le lien reçu par email.
          </p>
        </section>
      </main>
    </div>
  );
}
