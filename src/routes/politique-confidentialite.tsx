import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/politique-confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — ANSUT EVENT" },
      {
        name: "description",
        content:
          "Politique de confidentialité et de protection des données personnelles — Plateforme ANSUT EVENT.",
      },
      { property: "og:title", content: "Politique de confidentialité — ANSUT EVENT" },
      {
        property: "og:description",
        content:
          "Traitement des données, droits des utilisateurs et utilisation des cookies sur la plateforme ANSUT EVENT.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Accueil
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <span>Politique de confidentialité</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Politique de confidentialité
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <div className="mt-8 space-y-8">
        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données collectées sur la plateforme ANSUT
            EVENT est l'<strong>Agence Nationale du Service Universel des
            Télécommunications (ANSUT)</strong>, sous la tutelle du Ministère de la
            Transition Numérique et de l'Innovation Technologique (MTNIT) — République
            de Côte d'Ivoire.
          </p>
        </Section>

        <Section title="2. Cadre légal">
          <p>
            Le traitement est réalisé dans le respect de la <strong>loi ivoirienne n°2013-450
            du 19 juin 2013</strong> relative à la protection des données à caractère
            personnel, et en alignement avec les principes du <strong>Règlement Général sur la
            Protection des Données (RGPD)</strong> de l'Union européenne pour les
            utilisateurs concernés.
          </p>
        </Section>

        <Section title="3. Données collectées">
          <ul className="ml-5 list-disc space-y-1">
            <li>Données d'identification : nom, prénom, email, téléphone.</li>
            <li>Données professionnelles : organisation, fonction, pays.</li>
            <li>Données de connexion : adresse IP, horodatage, type de navigateur.</li>
            <li>Données d'usage : événements consultés, inscriptions, check-ins.</li>
          </ul>
        </Section>

        <Section title="4. Finalités du traitement">
          <ul className="ml-5 list-disc space-y-1">
            <li>Gestion des inscriptions et de la participation aux événements.</li>
            <li>Édition et vérification des badges (QR code).</li>
            <li>Communication d'informations relatives à l'événement.</li>
            <li>Statistiques anonymisées d'utilisation de la plateforme.</li>
            <li>Sécurité, prévention de la fraude et audit.</li>
          </ul>
        </Section>

        <Section title="5. Base légale">
          <p>
            Les traitements reposent sur votre <strong>consentement</strong> (inscription
            volontaire, dépôt de cookies non essentiels), sur l'<strong>exécution d'une
            mission d'intérêt public</strong> confiée à l'ANSUT, ou sur le respect
            d'<strong>obligations légales</strong>.
          </p>
        </Section>

        <Section title="6. Durée de conservation">
          <p>
            Les données d'inscription sont conservées pendant la durée de l'événement
            puis archivées pendant 3 ans à des fins administratives. Les journaux
            techniques sont conservés 12 mois maximum.
          </p>
        </Section>

        <Section title="7. Destinataires">
          <p>
            Les données ne sont communiquées qu'au personnel habilité de l'ANSUT, aux
            sous-traitants techniques liés par contrat de confidentialité, et, le cas
            échéant, aux autorités judiciaires ou administratives sur réquisition légale.
          </p>
        </Section>

        <Section title="8. Vos droits">
          <p>Vous disposez à tout moment des droits suivants :</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Droit d'accès, de rectification et d'effacement.</li>
            <li>Droit à la limitation et à l'opposition au traitement.</li>
            <li>Droit à la portabilité des données.</li>
            <li>Droit de retirer votre consentement à tout moment.</li>
            <li>Droit d'introduire une réclamation auprès de l'autorité de contrôle.</li>
          </ul>
          <p className="mt-2">
            Pour exercer vos droits, contactez le délégué à la protection des données :{" "}
            <a href="mailto:dpo@ansut.ci" className="text-primary underline">
              dpo@ansut.ci
            </a>
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            La plateforme utilise des cookies. Voir la section{" "}
            <Link to="/politique-confidentialite" hash="cookies" className="text-primary underline">
              gestion des cookies
            </Link>{" "}
            ci-dessous. Vous pouvez à tout moment modifier vos préférences via le bouton
            « Préférences cookies » disponible en pied de page.
          </p>
        </Section>

        <CookiesSection />

        <Section title="10. Sécurité">
          <p>
            Des mesures techniques et organisationnelles (chiffrement TLS, contrôle
            d'accès basé sur les rôles, journalisation, sauvegardes) sont mises en
            œuvre pour garantir la sécurité et la confidentialité de vos données.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function CookiesSection() {
  return (
    <section id="cookies" className="rounded-xl border border-border bg-muted/30 p-5">
      <h2 className="text-lg font-semibold text-foreground">Gestion des cookies</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Conformément au RGPD, seuls les cookies strictement nécessaires sont déposés
        sans votre consentement. Les autres catégories nécessitent un consentement
        explicite, libre, éclairé, spécifique et révocable à tout moment.
      </p>

      <div className="mt-4 space-y-3">
        <CookieRow
          name="Essentiels"
          desc="Indispensables au fonctionnement : session, authentification, préférences linguistiques."
          mandatory
        />
        <CookieRow
          name="Mesure d'audience"
          desc="Statistiques anonymisées d'utilisation de la plateforme (pages vues, durée de session)."
        />
        <CookieRow
          name="Fonctionnels"
          desc="Mémorisation de vos choix d'affichage (thème, filtres) pour améliorer l'expérience."
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Pour modifier vos préférences, cliquez sur « Préférences cookies » en bas de
        chaque page.
      </p>
    </section>
  );
}

function CookieRow({
  name,
  desc,
  mandatory,
}: {
  name: string;
  desc: string;
  mandatory?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <span
        className={
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
          (mandatory
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground")
        }
      >
        {mandatory ? "Obligatoire" : "Optionnel"}
      </span>
    </div>
  );
}
