import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ParticipantBottomNav } from "@/components/ParticipantBottomNav";
import { ChatBot } from "@/components/ChatBot";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import { WifiQrCode } from "@/components/WifiQrCode";
import {
  Building2,
  MapPin,
  Wifi,
  Clock,
  Megaphone,
  Vote,
  Phone,
  Mail,
  Pin,
} from "lucide-react";

export const Route = createFileRoute("/salon/$slug")({
  head: () => ({ meta: [{ title: "Salon — ANSUT EVENT" }] }),
  component: SalonPage,
});

function SalonPage() {
  const { slug } = Route.useParams();
  const { language, setLanguage, t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["salon", slug],
    queryFn: async () => {
      const { data: event, error } = await supabase
        .from("events")
        .select(
          "id, name, slug, starts_at, ends_at, location, wifi_ssid, wifi_password, wifi_encryption, contact_email, contact_phone",
        )
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
          .limit(3),
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

      return {
        event,
        announcements: annRes.data ?? [],
        activePolls,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data?.event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            Salon indisponible
          </h1>
          <p className="text-muted-foreground">
            Cet événement n'existe pas ou n'est pas encore publié.
          </p>
        </div>
      </div>
    );
  }

  const { event, announcements, activePolls } = data;
  const startsDate = new Date(event.starts_at);
  const endsDate = new Date(event.ends_at);
  const sameDay = startsDate.toDateString() === endsDate.toDateString();
  const dateFmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <ParticipantBottomNav slug={slug} />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">Salon</h1>
                <p className="text-sm text-muted-foreground">{event.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher
                language={language}
                onLanguageChange={setLanguage}
                compact
              />
              <Link
                to="/e/$slug"
                params={{ slug }}
                className="text-xs font-medium text-muted-foreground hover:text-primary"
              >
                {t("nav.home")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="max-w-3xl mx-auto px-4 py-6 space-y-6"
      >
        {/* ─── Informations pratiques ─── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
            Informations pratiques
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {/* Lieu */}
            {event.location && (
              <InfoRow icon={MapPin} label="Lieu" value={event.location} />
            )}

            {/* Horaires */}
            <InfoRow
              icon={Clock}
              label="Horaires"
              value={
                sameDay
                  ? `${dateFmt.format(startsDate)} · ${timeFmt.format(startsDate)} – ${timeFmt.format(endsDate)}`
                  : `Du ${dateFmt.format(startsDate)} au ${dateFmt.format(endsDate)}`
              }
            />

            {/* Wi-Fi */}
            {event.wifi_ssid && (
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Wifi className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Wi-Fi
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-800">
                      Réseau : <span className="font-mono">{event.wifi_ssid}</span>
                    </div>
                    {event.wifi_password && (
                      <div className="text-sm text-slate-600">
                        Mot de passe :{" "}
                        <span className="font-mono">{event.wifi_password}</span>
                      </div>
                    )}
                    <div className="mt-3">
                      <WifiQrCode
                        ssid={event.wifi_ssid}
                        password={event.wifi_password ?? ""}
                        encryption={
                          (event.wifi_encryption as "WPA" | "WEP" | "nopass") ??
                          "WPA"
                        }
                        size={140}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contacts */}
            {event.contact_email && (
              <InfoRow
                icon={Mail}
                label="Contact e-mail"
                value={
                  <a
                    href={`mailto:${event.contact_email}`}
                    className="text-primary hover:underline"
                  >
                    {event.contact_email}
                  </a>
                }
              />
            )}
            {event.contact_phone && (
              <InfoRow
                icon={Phone}
                label="Contact téléphone"
                value={
                  <a
                    href={`tel:${event.contact_phone}`}
                    className="text-primary hover:underline"
                  >
                    {event.contact_phone}
                  </a>
                }
              />
            )}
          </div>
        </section>

        {/* ─── Annonces ─── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Annonces
          </h2>
          {announcements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-muted-foreground">
              Aucune annonce pour le moment.
            </div>
          ) : (
            <ul className="space-y-2">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-2">
                    {a.is_pinned && (
                      <Pin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-slate-800">
                        {a.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">
                        {a.content}
                      </p>
                      {a.published_at && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {new Date(a.published_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ─── Sondages ─── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Vote className="h-4 w-4" /> Sondages
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            {activePolls > 0 ? (
              <>
                <p className="text-sm font-medium text-slate-800">
                  {activePolls} sondage{activePolls > 1 ? "s" : ""} actif
                  {activePolls > 1 ? "s" : ""} en session
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rendez-vous dans la salle de la session concernée pour voter.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun sondage actif pour le moment. Les sondages s'activent
                pendant les sessions interactives.
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Plateforme événementielle ANSUT
        </div>
      </footer>

      <ChatBot
        eventName={event.name}
        eventSlug={slug}
        venue={event.location ?? undefined}
        language={language}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="p-4 flex items-start gap-3">
      <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="mt-1 text-sm text-slate-800">{value}</div>
      </div>
    </div>
  );
}
