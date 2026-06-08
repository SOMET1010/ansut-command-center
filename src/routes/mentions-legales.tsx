import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — ANSUT EVENT" },
      {
        name: "description",
        content:
          "Mentions légales de la plateforme ANSUT EVENT — Ministère de la Transition Numérique et de l'Innovation Technologique, République de Côte d'Ivoire.",
      },
      { property: "og:title", content: "Mentions légales — ANSUT EVENT" },
      {
        property: "og:description",
        content: "Informations légales et éditoriales de la plateforme ANSUT EVENT.",
      },
    ],
  }),
  component: MentionsLegalesPage,
});

function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Accueil
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <span>Mentions légales</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Mentions légales
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <div className="prose prose-sm mt-8 max-w-none text-foreground">
        <Section title="Éditeur du site">
          <p>
            <strong>République de Côte d'Ivoire</strong>
            <br />
            Ministère de la Transition Numérique et de l'Innovation Technologique (MTNIT)
            <br />
            Agence Nationale du Service Universel des Télécommunications (ANSUT)
          </p>
          <p>
            Direction de la Transformation Digitale et de l'Innovation (DTDI)
            <br />
            Abidjan — Côte d'Ivoire
          </p>
        </Section>

        <Section title="Directeur de la publication">
          <p>Le Directeur Général de l'ANSUT.</p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question relative au site ou à la plateforme : contact@ansut.ci
          </p>
        </Section>

        <Section title="Hébergement">
          <p>
            La plateforme est hébergée sur une infrastructure cloud sécurisée opérée pour
            le compte de l'ANSUT.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L'ensemble des contenus (textes, logos, images, vidéos, marques) figurant sur
            ce site est protégé par les lois en vigueur sur la propriété intellectuelle.
            Toute reproduction, représentation, diffusion ou rediffusion, totale ou
            partielle, est strictement interdite sans l'autorisation écrite préalable de
            l'ANSUT.
          </p>
        </Section>

        <Section title="Données personnelles">
          <p>
            Les données collectées sur cette plateforme sont traitées conformément à la loi
            n°2013-450 du 19 juin 2013 relative à la protection des données à caractère
            personnel en République de Côte d'Ivoire.
          </p>
          <p>
            Vous disposez d'un droit d'accès, de rectification, d'opposition et de
            suppression de vos données. Pour exercer ces droits, écrivez à
            dpo@ansut.ci.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Le site utilise uniquement des cookies techniques nécessaires au fonctionnement
            de la plateforme (session, préférences linguistiques). Aucun cookie publicitaire
            ou de profilage n'est déposé.
          </p>
        </Section>

        <Section title="Responsabilité">
          <p>
            L'ANSUT s'efforce d'assurer l'exactitude et la mise à jour des informations
            diffusées sur ce site, mais ne saurait être tenue pour responsable des
            inexactitudes, omissions ou dommages directs ou indirects résultant de leur
            utilisation.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
