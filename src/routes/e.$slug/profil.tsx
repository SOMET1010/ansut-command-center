import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EventLayout } from "@/components/EventLayout";
import { MyBadgeCard } from "@/components/MyBadgeCard";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Bookmark, LogOut, Globe } from "lucide-react";
import { getParticipantToken, clearParticipantToken } from "@/lib/token";

export const Route = createFileRoute("/e/$slug/profil")({
  head: () => ({ meta: [{ title: "Mon profil — SUTEL 2026 | ANSUT EVENT" }] }),
  component: ProfilPage,
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

const CATEGORY_LABELS: Record<string, string> = {
  fsu: "Fonds de Service Universel",
  regulator: "Régulateur",
  operator: "Opérateur télécom",
  partner: "Partenaire financier",
  startup: "Startup / Innovation",
  international_org: "Organisation internationale",
  government: "Gouvernement",
  exhibitor: "Exposant",
  sponsor: "Sponsor",
  speaker: "Intervenant",
  vip: "VIP",
  press: "Presse",
  staff: "Staff",
  visitor: "Visiteur",
  other: "Participant",
};

function ProfilPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    setToken(getParticipantToken(slug));
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
      return ((data ?? []) as { session_id: string }[]).map((b) => b.session_id);
    },
  });

  function disconnect() {
    clearParticipantToken(slug, token);
    navigate({ to: `/e/${slug}` }).catch(() => {});
  }

  if (!token) {
    return (
      <EventLayout eventId="" eventName="" slug={slug} qrToken={null}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Aucun badge sur cet appareil</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Ouvrez le lien d'accès reçu par email ou inscrivez-vous pour accéder à votre profil SUTEL 2026.
          </p>
          <a
            href={`/e/${slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
          >
            M'inscrire à l'événement
          </a>
        </div>
      </EventLayout>
    );
  }

  if (meLoading) {
    return (
      <EventLayout eventId="" eventName="" slug={slug} qrToken={token}>
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </EventLayout>
    );
  }

  if (!me) {
    return (
      <EventLayout eventId="" eventName="" slug={slug} qrToken={token}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Badge introuvable</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Le badge enregistré sur cet appareil n'est pas reconnu. Il a peut-être été annulé ou appartient à un autre événement.
          </p>
          <button
            onClick={disconnect}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            Effacer ce badge
          </button>
        </div>
      </EventLayout>
    );
  }

  return (
    <EventLayout eventId={me.event_id} eventName="" slug={slug} qrToken={token}>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex items-center gap-3">
          <UserIcon className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Mon profil</h1>
        </div>

        {/* Badge */}
        <MyBadgeCard qrToken={token} />

        {/* Infos profil */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold">Mes informations</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{me.full_name}</span>
            </div>
            {me.organization && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organisation</span>
                <span className="font-medium">{me.organization}</span>
              </div>
            )}
            {me.job_position && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fonction</span>
                <span className="font-medium">{me.job_position}</span>
              </div>
            )}
            {me.participant_category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catégorie</span>
                <span className="font-medium">{CATEGORY_LABELS[me.participant_category] ?? me.participant_category}</span>
              </div>
            )}
          </div>
        </section>

        {/* Favoris */}
        {bookmarkIds.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold mb-3">
              <Bookmark className="h-4 w-4 text-primary" />
              Mes sessions favorites
            </h3>
            <p className="text-sm text-muted-foreground">{bookmarkIds.length} session{bookmarkIds.length > 1 ? "s" : ""} sauvegardée{bookmarkIds.length > 1 ? "s" : ""}</p>
            <a href={`/e/${slug}/agenda`} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Voir le programme →
            </a>
          </section>
        )}

        {/* Déconnexion */}
        <section className="space-y-2">
          <button
            onClick={disconnect}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Me déconnecter de cet appareil
          </button>
          <p className="text-[11px] text-gray-500 text-center">
            Votre badge reste valide. Vous pourrez vous reconnecter via le lien reçu par email.
          </p>
        </section>
      </div>
    </EventLayout>
  );
}