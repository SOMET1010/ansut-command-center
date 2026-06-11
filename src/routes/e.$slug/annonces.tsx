import { createFileRoute } from "@tanstack/react-router";
import { EventLayout } from "@/components/EventLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Megaphone, Vote, Pin } from "lucide-react";

export const Route = createFileRoute("/e/$slug/annonces")({
  head: () => ({ meta: [{ title: "Infos pratiques — SUTEL 2026 | ANSUT EVENT" }] }),
  component: AnnoncesPage,
});

function AnnoncesPage() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["annonces-page", slug],
    queryFn: async () => {
      const { data: event, error } = await supabase
        .from("events")
        .select("id, name, slug, starts_at, ends_at, location")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;

      const nowIso = new Date().toISOString();
      const [annRes, sessRes] = await Promise.all([
        supabase
          .from("event_announcements")
          .select("id, title, content, is_pinned, published_at")
          .eq("event_id", event.id)
          .lte("published_at", nowIso)
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(10),
        supabase
          .from("event_sessions")
          .select("id")
          .eq("event_id", event.id),
      ]);

      const sessionIds = (sessRes.data ?? []).map((s) => s.id);
      let activePolls = 0;
      if (sessionIds.length > 0) {
        const { count } = await supabase
          .from("live_polls")
          .select("id", { count: "exact", head: true })
          .in("session_id", sessionIds)
          .eq("is_active", true);
        activePolls = count ?? 0;
      }

      return { event, announcements: annRes.data ?? [], activePolls };
    },
  });

  if (isLoading) {
    return (
      <EventLayout eventId="" eventName="" slug={slug} qrToken={null}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </EventLayout>
    );
  }

  if (!data?.event) {
    return (
      <EventLayout eventId="" eventName="" slug={slug} qrToken={null}>
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold">Événement indisponible</h1>
          <p className="text-muted-foreground">Cet événement n'existe pas ou n'est pas encore publié.</p>
        </div>
      </EventLayout>
    );
  }

  const { event, announcements, activePolls } = data;
  const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

  return (
    <EventLayout eventId={event.id} eventName={event.name} slug={slug} qrToken={null}>
      <div className="space-y-8">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold">Infos pratiques</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>

        {/* Lieu + horaires */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Informations pratiques
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lieu</span>
              <span className="font-medium">{event.location || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horaires</span>
              <span className="font-medium">
                {event.starts_at.split("T")[0] === event.ends_at.split("T")[0]
                  ? `${dateFmt.format(new Date(event.starts_at))} · ${timeFmt.format(new Date(event.starts_at))} – ${timeFmt.format(new Date(event.ends_at))}`
                  : `Du ${dateFmt.format(new Date(event.starts_at))} au ${dateFmt.format(new Date(event.ends_at))}`}
              </span>
            </div>
          </div>
        </section>

        {/* Wi-Fi */}
        {event.wifi_ssid && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Wifi className="h-4 w-4 text-primary" />
              Wi-Fi
            </h2>
            <WifiQrCode
              ssid={event.wifi_ssid}
              password={event.wifi_password ?? undefined}
              encryption={event.wifi_encryption ?? "WPA"}
            />
          </section>
        )}

        {/* Annonces */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Megaphone className="h-4 w-4 text-primary" />
            Annonces
          </h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    {a.is_pinned && <Pin className="h-3 w-3 mt-1 shrink-0 text-amber-600" />}
                    <div>
                      <h3 className="font-semibold text-sm">{a.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sondages */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Vote className="h-4 w-4 text-primary" />
            Sondages
          </h2>
          {activePolls > 0 ? (
            <p className="text-sm">
              <span className="font-semibold">{activePolls} sondage{activePolls > 1 ? "s" : ""} actif{activePolls > 1 ? "s" : ""}</span> en session. Rendez-vous dans la salle de la session concernée pour voter.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun sondage actif pour le moment. Les sondages s'activent pendant les sessions interactives.
            </p>
          )}
        </section>
      </div>
    </EventLayout>
  );
}