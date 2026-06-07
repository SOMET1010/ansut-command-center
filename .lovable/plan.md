## Audit ANSUT — Correction cohérence couleurs / contrastes / espacements

### Problèmes constatés (preuves visuelles)

**Login & Signup**
- Bouton `Se connecter` / `Créer mon compte` : `bg-accent text-accent-foreground` → fond bleu très clair (#DCE8F5) + texte clair = **bouton illisible**. Doit passer en `bg-primary` (CTA standard) ou `variant="ansut-orange"` (CTA dominant, 1/écran).
- Liens `Pas de compte ?` / `Déjà un compte ?` : `text-accent` sur fond blanc = **invisible**. → `text-primary hover:underline`.
- Côté navy : icônes `ShieldCheck` / `Sparkles` / chip "SUTEL 2026" en `text-accent` / `bg-accent/10` sur navy = contraste faible (gris bleuté). → `text-secondary` (orange, vrai accent de marque).
- Pastille animée `bg-accent` dans la chip → `bg-secondary`.

**Landing**
- Cartes features (Participants, Conférences, Accréditation, Live Polling, Exposition, Analytics) : `bg-secondary/40` = **orange à 40 % indésirable** (peau saumon). Casse la règle « orange parcimonie ». → `bg-muted` (gris doux institutionnel).
- Section partenaires `bg-secondary/40` : même peau orange. → `bg-muted`.
- Icônes features `text-accent` sur carte blanche : invisible. → `text-primary`.
- Liens CTA cartes (`Gérer les participants` etc.) `text-accent` : invisible. → `text-primary`.
- Stat highlight `border-accent/40 bg-accent/10 text-accent` sur navy = trop pâle. → `border-secondary/40 bg-secondary/10 text-secondary` (mise en valeur réelle).
- Chip "SUTEL 2026 • DATES" et puce animée `bg-accent` sur navy = peu visible. → `bg-secondary` + `border-secondary/30`.
- Nav top : `text-accent-foreground` sur bouton accent → bouton "Créer un compte" `bg-accent` invisible. → `variant="ansut-orange"`.
- Carte "Programme du jour" : lien `Voir tout` en `text-accent` sur fond blanc = invisible. → `text-primary`.
- Section "Votre badge, votre accès" sur fond `bg-primary` : badge step `border-accent/30 bg-accent/10 text-accent` (bleu pâle sur bleu) = faible contraste. → `border-secondary/40 bg-secondary/15 text-secondary`.
- Halo décoratif `bg-accent/20 blur-[120px]` : invisible sur navy. → `bg-secondary/25` (touche orange chaude conforme à la marque).
- Footer texte `text-white/60` sur `bg-primary` (#2256A3) : contraste ~2.8:1 = **AA non atteint**. → `text-white/75`.

**Dashboard, Events, Checkin**
- `ExecHero` éveille `text-secondary` pour l'eyebrow Sparkles : OK.
- Pages Events / Checkin : suite à la migration `card-elevated`, les colonnes restent OK mais le **placeholder ComingSoon** sur Participants/Polls n'a pas été audité (`text-accent` probable). → vérifier `coming-soon.tsx` et basculer.
- Espacement dashboard : `section-gap` est en `flex-direction: column` (notre `@utility`) — bon. Cartes `KPICard` : padding `p-4` cohérent.
- Events : `<Table>` shadcn récupère naturellement `text-muted-foreground`/`text-foreground` — pas de souci de contraste.
- Checkin : badges `bg-ansut-orange-light` / `border-signal-warning` corrects (déjà migrés).

**Typographie globale**
- `--font-display` et `--font-sans` pointent tous deux vers Inter. Conforme à la skill (Avenir indisponible en web font libre → Inter unique), mais on perd la différenciation visuelle des titres. **Conserver** Inter unique mais s'assurer que les `h1/h2/h3` utilisent bien `font-bold` / `font-semibold` (déjà appliqué en `@layer base`).

**Espacements**
- Pages internes (`/dashboard`, `/events`, `/checkin`) bénéficient désormais de `page-max-width content-padding py-4 md:py-5` via `_authenticated.tsx`. Les `p-8` / `p-6` résiduels en haut de chaque route doivent être **supprimés** (ils s'ajoutent au padding du shell → double bordure).
  - `events.tsx` : déjà migré en `section-gap` (OK).
  - `checkin.tsx` : déjà migré (OK).
  - `dashboard.tsx` : OK.
- Landing public reste hors shell auth → ses `py-24` / `max-w-7xl` propres sont OK.

### Corrections proposées (fichier par fichier)

1. **`src/routes/login.tsx`**
   - Bouton submit : `bg-accent text-accent-foreground` → `bg-primary text-primary-foreground` (ou variant `ansut-orange` pour un CTA dominant — décision : garder `bg-primary` pour cohérence avec dashboard et libérer l'orange pour les actions DG).
   - Lien `Créer un compte` : `text-accent` → `text-primary`.
   - Panneau navy : `text-accent`, `bg-accent/10`, `border-accent/30` → `text-secondary`, `bg-secondary/10`, `border-secondary/30`. Halo `bg-accent/25` → `bg-secondary/25`.
   - Logo "A" badge : `bg-accent text-accent-foreground` → `bg-secondary text-secondary-foreground`.
   - Gradient titre `from-white to-[oklch(0.75_0.08_245)]` : remplacer la couleur arbitraire par une variable token compatible (`to-secondary/70` ou simplement supprimer le gradient — texte blanc plein suffit).

2. **`src/routes/signup.tsx`** : mêmes substitutions (parité visuelle avec login).

3. **`src/routes/index.tsx` (landing)**
   - Cartes features : `bg-secondary/40 hover:bg-card` → `bg-muted hover:bg-card`. Icônes `text-accent` → `text-primary`. Liens CTA `text-accent` → `text-primary`. Puces `bg-accent` → `bg-primary`.
   - Section partenaires : `bg-secondary/40` → `bg-muted`.
   - Nav : bouton "Créer un compte" `bg-accent` → `variant="ansut-orange"`.
   - Hero chip + dot animé : `border-accent/30 bg-accent/10 text-accent` + `bg-accent` → versions `secondary`.
   - Halo décoratif hero : `bg-accent/20` → `bg-secondary/20`.
   - StatCard highlight : version `secondary` (les icônes restent en `text-secondary`, neutres en `text-white/70` au lieu de `text-accent`).
   - Programme du jour : `text-accent` link → `text-primary`. Tag "Conférence" `bg-accent/10 text-accent` → `bg-primary/10 text-primary`.
   - Section badge sur bg-primary : `border-accent/30 bg-accent/10 text-accent` → `border-secondary/40 bg-secondary/15 text-secondary`.
   - CTA principal hero "S'inscrire au SUTEL 2026" : actuellement `bg-white text-primary` (OK, contraste fort).
   - Sparkles "TOUT EN UN SEUL ENDROIT" : `text-accent` → `text-secondary` (1 occurrence, parcimonie respectée).
   - Footer : `text-white/60` → `text-white/75` pour atteindre AA.

4. **`src/components/coming-soon.tsx`** : auditer et migrer `text-accent` éventuels vers `text-primary` / `text-secondary`.

5. **`src/components/newsletter-form.tsx`** : auditer le bouton submit (probablement `bg-primary` — OK) et les liens secondaires.

6. **Aucune modification de `src/styles.css`** : les tokens restent ceux validés par la skill ANSUT. Les corrections portent uniquement sur l'usage sémantique dans les composants.

### Règles d'or à respecter après correction

- **`--primary`** (bleu ANSUT) = CTA standard, icônes d'emphase, liens actifs.
- **`--secondary`** (orange ANSUT) = **1 CTA dominant max / écran**, chips de marque, accents décoratifs sur fond sombre.
- **`--accent`** = surface de hover discrète **uniquement** (`hover:bg-accent`). Jamais pour un CTA ou un texte.
- **`--suta-purple`** = panneaux IA uniquement (déjà respecté via `SutaPanel`).
- **Signaux** = états (critique/vigilance/stable/ok) — déjà OK.

### Vérification post-correction

Après application : recapture des 6 pages (`/`, `/login`, `/signup`, `/dashboard`, `/events`, `/checkin`) en 1366×768 et 390×844, vérification que :
- Aucun bouton n'est illisible (texte ≥ 4.5:1 vs fond).
- Orange présent au plus 1 fois par section.
- Aucun `text-accent` ou `bg-accent` non-hover ne subsiste (`rg "text-accent|bg-accent[^-]" src/`).

### Hors scope

- Refonte structurelle / wireframe (pages restent telles quelles).
- Mode sombre toggle (les tokens dark sont prêts mais non exposés à l'UI).
- Composants ANSUT additionnels (`GlobalFilterBar`, `NotificationCenter`, …) — non demandés ici.
