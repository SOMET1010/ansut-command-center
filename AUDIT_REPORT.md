# Rapport d'Audit et Propositions de Refonte : ANSUT Command Center

Ce document présente l'analyse détaillée du code source du projet `ansut-command-center` et propose des recommandations concrètes pour l'amélioration de l'architecture, de la sécurité, de la qualité du code, de l'expérience utilisateur (UX) et de l'interface utilisateur (UI), avec une attention particulière portée à l'inclusion sociale numérique.

## Analyse de l'Architecture et de la Qualité du Code

Le projet repose sur une stack moderne et performante, associant TanStack Start pour le rendu et le routage, Tailwind CSS v4 pour le styling, et Supabase pour le backend. L'utilisation de TanStack Start offre un excellent compromis entre rendu côté serveur et interactivité côté client, garantissant de bonnes performances globales. Du côté de la base de données, la sécurité est bien prise en compte grâce à une configuration stricte du Row Level Security (RLS). Les rôles sont distinctement séparés (super_admin, org_admin, staff, etc.) et les opérations critiques, telles que l'inscription et le check-in, sont encapsulées dans des fonctions RPC sécurisées. Le design system initial s'appuie sur Radix UI et des variables CSS sémantiques qui respectent les couleurs institutionnelles de l'ANSUT, posant ainsi des bases solides pour la cohérence visuelle.

Cependant, plusieurs problèmes d'architecture et de conception ont été identifiés. On observe un mélange problématique entre le front-office et le back-office sur la page d'accueil publique (`index.tsx`), qui intègre des liens directs vers des routes du cockpit privé, créant une confusion entre l'espace marketing et l'espace d'administration. De plus, les pages de connexion (`login.tsx`) et d'inscription (`signup.tsx`) souffrent d'une forte duplication de code, partageant une structure visuelle presque identique qui alourdit inutilement la maintenance. L'interface d'administration, notamment sur la page de gestion des inscriptions (`events.$id.registrations.tsx`), est particulièrement dense et utilitaire. Elle manque de hiérarchisation visuelle et de synthèse, ce qui nuit à la lecture rapide des informations. Enfin, la présence de modules promis dans la navigation (comme les Participants et le Live Polling) qui ne sont que des placeholders (`ComingSoon`) indique des fonctionnalités incomplètes.

## Analyse de l'Expérience Utilisateur (UX) et de l'Inclusion Sociale

La conception actuelle, bien que moderne, présente des freins importants à l'inclusion sociale numérique. L'utilisateur final de la plateforme publique peut avoir des niveaux de littératie numérique très variables, ce qui nécessite une approche de conception plus simple et plus guidée.

La complexité perçue de la page d'accueil constitue un obstacle majeur. Très chargée en informations, statistiques, agenda détaillé et nombreuses cartes de fonctionnalités, elle risque de submerger un utilisateur peu familier avec l'informatique. Les formulaires, bien qu'ils soient fonctionnels, manquent d'accompagnement clair et d'indicateurs visuels forts pour guider l'utilisateur pas à pas. Par ailleurs, des incohérences de branding ont été relevées, notamment sur la page publique d'inscription à un événement (`e.$slug.tsx`), qui n'utilise pas le composant officiel `AnsutLogo`, créant ainsi une rupture dans l'identité visuelle et la confiance de l'utilisateur.

## Propositions de Corrections et de Refonte Visuelle

Conformément aux exigences de l'ANSUT et à l'objectif primordial d'inclusion sociale numérique, la refonte visuelle doit se concentrer sur la simplification, la clarté, et le respect strict de l'identité visuelle institutionnelle.

### Simplification du Front-Office

Pour répondre aux enjeux d'inclusion sociale, il est impératif d'épurer la Landing Page (`index.tsx`). Il faut réduire drastiquement la densité d'informations pour se concentrer sur un message principal clair et un bouton d'action proéminent pour l'inscription. Les statistiques complexes et les accès au back-office doivent être masqués ou relégués au second plan. La page d'inscription événementielle (`e.$slug.tsx`) doit être harmonisée en intégrant le logo officiel de l'ANSUT et en proposant un formulaire plus lisible, doté de champs plus larges, de labels explicites et de messages d'erreur clairs. Enfin, l'authentification doit être consolidée en refondant `login.tsx` et `signup.tsx` pour utiliser un layout partagé, ce qui allégera le code et garantira une expérience utilisateur plus fluide.

### Amélioration du Cockpit (Back-Office)

Les tableaux de bord de l'interface d'administration doivent gagner en clarté. Il est nécessaire d'aérer les interfaces denses comme `events.$id.registrations.tsx` en utilisant des éléments visuels sémantiques, tels que des badges colorés pour les statuts, plutôt que du texte brut. Une séparation stricte et nette doit être établie entre la navigation du cockpit et la navigation publique pour éviter toute confusion.

### Direction Artistique

La refonte s'appuiera sur une direction artistique renforcée, utilisant le Bleu ANSUT (`#2256A3`) comme couleur principale pour les fonds et les headers, et l'Orange ANSUT (`#F08224`) de manière parcimonieuse, exclusivement pour les appels à l'action majeurs. La typographie et les espacements seront revus à la hausse pour améliorer la lisibilité sur tous les supports, garantissant ainsi une interface accessible aux publics moins à l'aise avec le numérique.

| Élément | Problème Actuel | Solution Proposée |
| :--- | :--- | :--- |
| **Page d'accueil (`index.tsx`)** | Trop dense, liens vers l'admin présents | Épuration, focus sur le CTA d'inscription, suppression des liens admin |
| **Inscription événement (`e.$slug.tsx`)** | Absence du logo officiel, formulaire austère | Ajout du `AnsutLogo`, élargissement des champs, amélioration de la lisibilité |
| **Auth (`login.tsx` / `signup.tsx`)** | Forte duplication de code visuel | Création d'un layout d'authentification partagé |
| **Cockpit (`events.$id.registrations.tsx`)**| Tableaux trop denses, statuts en texte brut | Aération visuelle, utilisation de badges colorés sémantiques pour les statuts |
