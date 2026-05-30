import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, QrCode, BarChart3, Vote, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ANSUT EVENT — Plateforme de gestion d'événements" },
      {
        name: "description",
        content:
          "ANSUT EVENT : inscriptions, badges QR, agenda, live polling et tableaux de bord pour vos événements institutionnels.",
      },
      { property: "og:title", content: "ANSUT EVENT" },
      { property: "og:description", content: "Plateforme événementielle multi-tenant ANSUT" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Calendar, title: "Gestion d'événements", desc: "Créez et publiez vos événements en quelques clics." },
  { icon: Users, title: "Inscriptions & accréditation", desc: "Formulaires publics, validation et suivi en temps réel." },
  { icon: QrCode, title: "Badges QR & check-in", desc: "Génération de badges signés et scan rapide sur site." },
  { icon: Vote, title: "Live Polling", desc: "Sondages et quiz interactifs façon Kahoot." },
  { icon: Bell, title: "Notifications", desc: "WhatsApp, Telegram et e-mail intégrés." },
  { icon: BarChart3, title: "Dashboard analytics", desc: "Mesurez participation et engagement instantanément." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              A
            </div>
            <span className="text-lg font-semibold">ANSUT EVENT</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Créer un compte</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">
            Plateforme événementielle ANSUT
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Orchestrez vos événements de bout en bout
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Inscriptions, badges QR, agenda, live polling, notifications et dashboard — une seule
            plateforme multi-tenant, pensée pour SUTEL et les événements institutionnels.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Commencer</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ANSUT — Agence Nationale du Service Universel des Télécommunications
        </div>
      </footer>
    </div>
  );
}
