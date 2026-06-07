## Refonte ANSUT — Charte exécutive

Adaptation de la skill **ansut-design-system** (écrite pour Tailwind v3 + HSL) au stack actuel (**Tailwind v4 + OKLCH + tokens dans `src/styles.css`**, pas de `tailwind.config.ts`). La charte sémantique reste 100 % respectée, seule la syntaxe des tokens change.

### 1. Design tokens (`src/styles.css`)

Remplacement complet de la palette Navy Trust actuelle par la palette ANSUT, traduite en OKLCH :

- **ANSUT Blue** `#2256A3` → `--primary`
- **ANSUT Blue Dark** `#0E2440` → `--sidebar`, gradient header
- **ANSUT Orange** `#F08224` → `--secondary` (CTA majeurs, parcimonie)
- **SUTA Purple** `#6366F1` → `--suta` (exclusivement IA)
- **Signaux** : `--signal-critical / warning / stable / ok`
- Gradients : `--gradient-sidebar`, `--gradient-header`, `--gradient-kpi-hero`
- Utilitaires v4 : `@utility glass`, `@utility sidebar-glass`, `@utility card-elevated`, `@utility card-elevated-hover`, `@utility suta-border-animated`, `@utility content-padding`, `@utility section-gap`, `@utility page-max-width`
- Fonts : Avenir → fallback Inter (chargé via `<link>` dans `__root.tsx` — Space Grotesk/DM Sans retirés)
- Mode sombre : variantes `.dark` complètes
- Touch targets 44×44 sur pointeurs coarse + reduced-motion

### 2. Composants exécutifs (`src/components/ansut/`)

| Composant | Rôle |
|---|---|
| `KPICard.tsx` | Titre uppercase, valeur tabulaire `text-3xl font-bold`, trend coloré (signal), `<TrafficLight />` intégrée |
| `TrafficLight.tsx` | Pastille vert/orange/rouge (signal-ok / warning / critical) avec tooltip |
| `AlertBanner.tsx` | Bandeau gauche bordé `border-l-4 border-signal-critical bg-ansut-danger-light` |
| `SutaPanel.tsx` | Panneau IA `suta-border-animated` + badge violet « IA » |
| `ExecHero.tsx` | Bandeau Zone 1 avec `--gradient-kpi-hero`, 1 KPI dominant + 3-4 satellites |
| `SectionGrid.tsx` | Helper grille `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` |

Variante bouton ajoutée dans `button.tsx` : `ansut-orange` (CTA secondaire orange, 1 par écran max).

### 3. Layout 3 zones — AppShell

Refonte de `src/routes/_authenticated.tsx` :

```text
┌──────────┬─────────────────────────────────────────┐
│          │  TopBar (clair, breadcrumb, notifs)     │
│ Sidebar  ├─────────────────────────────────────────┤
│ (sombre, │  Zone 1 — ExecHero (gradient navy)      │
│ gradient,│  ┌─ KPI dominant ─┬─ 3-4 satellites ─┐ │
│ collap-  │  └────────────────┴───────────────────┘ │
│ sible    ├─────────────────────────────────────────┤
│ icon)    │  Zone 2 — Analyse (grille cards)        │
│          ├─────────────────────────────────────────┤
│          │  Zone 3 — SUTA / Actions DG             │
└──────────┴─────────────────────────────────────────┘
```

- Sidebar passe en `bg-sidebar` + `sidebar-glass` (gradient vertical sombre), logo + rôle DG, sections fixes (Pilotage / Modules / Exécution), mode collapsed icon-only.
- TopBar : breadcrumb dérivé de la route, bouton notifs (badge orange si alertes), avatar + déconnexion.
- Contenu : `content-padding page-max-width section-gap`, objectif **zero scroll** en 1440×900.

### 4. Pages refondues selon layout 3 zones

- **`/dashboard`** : ExecHero avec « Indice de Maîtrise » (KPI dominant) + Événements/Participants/Check-ins/Sondages (satellites) → grille 3 QuickActions → SutaPanel (suggestions IA mockées).
- **`/events`**, **`/participants`**, **`/polls`**, **`/checkin`** : header compact + grille cards `card-elevated`, suppression des shadows lourdes.
- **`/login`**, **`/signup`** : passage en `bg-card` + `card-elevated`, CTA principal `bg-primary`, accent orange retiré du panneau gauche (remplacé par `--gradient-header`).
- **`/`** (landing) : conserve l'identité actuelle mais migre vers les nouveaux tokens (primary bleu ANSUT, accent orange parcimonie).

### 5. Règles dures appliquées

1. Aucun hex en composant — tout via tokens sémantiques.
2. Orange réservé aux CTA majeurs (max 1/écran) et badges vigilance.
3. Violet réservé à l'IA (SutaPanel uniquement).
4. `card-elevated` partout, **plus de `shadow-lg/xl`**.
5. Layout 3 zones par défaut sur écrans authentifiés.
6. Fonts : Inter (fallback Avenir), Space Grotesk + DM Sans retirés.

### 6. Hors scope (skill ANSUT mais non livré ici)

- `useAppStore` Zustand (filtres globaux Année/Trim/Mois/Direction) — pas de données métier qui le justifient encore.
- `GlobalFilterBar`, `NotificationCenter`, `StorytellingMode`, `PresentationMode` — à activer quand les écrans pilotage seront brancheés sur de vraies données KPI.
- Mode sombre toggle UI (les tokens `.dark` sont prêts, le switch viendra avec les préférences utilisateur).

### Détails techniques

- Tokens OKLCH calculés depuis les HSL de la skill (ex: `211 65% 39%` → `oklch(0.49 0.13 256)`).
- `@theme` v4 inline mapping pour exposer `bg-ansut-blue`, `text-signal-critical`, etc.
- `@source inline("…")` pour safelister les classes signal/ansut dynamiques utilisées via props.
- `font-family` : `"Inter", "Avenir", system-ui, sans-serif` (Avenir n'étant pas une web font libre, Inter sert de rendu effectif partout).
- Retrait des imports `@fontsource/space-grotesk` et `@fontsource/dm-sans` dans `__root.tsx`, remplacés par `@fontsource/inter`.
