---
name: ansut-logo
description: Logo officiel ANSUT (asset CDN + composant React AnsutLogo). À utiliser dès qu'une page, un header, un sidebar, un footer, un email ou un export PDF doit afficher l'identité visuelle ANSUT — ne jamais ré-uploader le fichier ni recréer un badge "A".
---

# Logo ANSUT — usage officiel

Identité visuelle de l'Agence Nationale du Service Universel des Télécommunications-TIC (Côte d'Ivoire). Le logo combine un éventail de points orange (4 arcs concentriques) et le wordmark **ANSUT** en bleu (#2256A3) avec la baseline « AGENCE NATIONALE DU SERVICE UNIVERSEL DES TÉLÉCOMMUNICATIONS-TIC ».

## 1. Asset canonique

Le fichier est hébergé sur le CDN Lovable Assets — **ne jamais le ré-uploader**.

- Pointeur : `src/assets/logo-ansut.jpg.asset.json`
- Format : JPG sur fond blanc, ~395 KB, ratio ~2.4:1
- Source originale (référence) : `logo ANSUT def.pdf` fourni par la DG ANSUT

## 2. Composant React (source de vérité)

`src/components/ansut/Logo.tsx` exporte `<AnsutLogo />`. **Toujours l'utiliser** — ne pas refaire un `<img>` ni un badge texte.

```tsx
import { AnsutLogo } from "@/components/ansut/Logo";

<AnsutLogo size="md" />            // header standard
<AnsutLogo size="lg" />            // panneaux d'autorité (sidebar, hero auth)
<AnsutLogo size="sm" withLink />   // footer, mentions, lien vers /
```

Props :
| Prop | Type | Défaut | Usage |
|---|---|---|---|
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Hauteurs : 32 / 40 / 56 px |
| `withLink` | `boolean` | `false` | Wrappe dans un `<Link to="/">` |
| `alt` | `string` | nom officiel complet | Override en cas de contexte spécifique |
| `className` | `string` | — | Classes additionnelles sur le conteneur |

Le composant rend le logo **dans un conteneur blanc arrondi `rounded-md bg-white ring-1 ring-black/5`**. Ce wrapper garantit la lisibilité sur les fonds bleus / sombres ANSUT (gradient hero, sidebar navy) sans déformer les couleurs officielles.

## 3. Règles d'usage (non négociables)

1. **Couleurs verrouillées** : orange `#F08224` (arcs) + bleu `#2256A3` (wordmark). Ne jamais teinter, inverser, ou appliquer un filtre CSS au logo.
2. **Fond blanc obligatoire** sous le logo. Le composant l'applique d'office — ne jamais l'override avec `bg-transparent` ou `bg-primary`.
3. **Pas de déformation** : `object-contain` impose le ratio natif. Ne jamais utiliser `w-full h-full` sans `object-contain`.
4. **Zone de respect** : marge minimale = hauteur de la lettre "A" du wordmark (~25 % de la hauteur du logo). Le composant l'assure via `px-2.5` / `px-4`.
5. **Pas de logo seul** sur les écrans produit. Toujours accompagner d'un suffixe contextuel (`EVENT`, `SUTEL 2026`, `Console DG`) pour distinguer le logo institutionnel ANSUT de l'application courante.
6. **Le badge "A" orange est interdit** comme substitut. Si un emplacement est trop petit pour le logo complet (favicon, avatar), utiliser le composant à `size="sm"` ou demander un logomark dédié (arcs orange seuls) — ne jamais bricoler une lettre.
7. **Alt text** : conserver le nom officiel complet par défaut. Override uniquement pour un contexte plus précis (jamais juste "logo").

## 4. Où le logo est déjà intégré

- `src/routes/index.tsx` — nav landing (header sticky bleu)
- `src/routes/login.tsx` — panneau navy gauche (lg) + en-tête formulaire mobile
- `src/routes/signup.tsx` — panneau navy gauche (lg) + en-tête formulaire mobile

À ajouter quand pertinent : `AppSidebar` (header sidebar dark), footer landing, emails transactionnels (utiliser `logoAsset.url` absolu), exports PDF.

## 5. Bootstrap dans un nouveau projet ANSUT

1. Récupérer le pointeur `src/assets/logo-ansut.jpg.asset.json` ou ré-uploader le PDF/JPG officiel via `lovable-assets create --file logo-ansut.jpg`.
2. Copier `src/components/ansut/Logo.tsx` tel quel.
3. Importer `<AnsutLogo />` partout où l'identité ANSUT doit apparaître.
4. Supprimer tout badge "A" hérité d'anciens prototypes.

## 6. Hard rules (récap)

1. **Un seul composant** : `<AnsutLogo />`. Pas de `<img src=...>` direct sur le logo.
2. **Un seul asset CDN** : ne pas dupliquer l'upload — réutiliser le pointeur existant.
3. **Couleurs et ratio inviolables** : pas de teinte, pas de stretch, pas de filtre.
4. **Toujours sur fond blanc** (le composant l'applique).
5. **Jamais de badge "A"** comme fallback.
