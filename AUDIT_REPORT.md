# Audit de code — ANSUT Command Center

**Date :** 7 juin 2026  
**Auditeur :** Consultant DTDI  
**Branche auditée :** `main`  
**Stack :** TanStack Start (SSR) + React 19 + Supabase + Tailwind CSS v4

---

## 1. Résumé exécutif

Le projet **ANSUT Command Center** est une plateforme événementielle destinée à la gestion du SUTEL 2026. L'audit révèle une base technique solide (SSR, RPC Supabase, design system cohérent) mais identifie des axes d'amélioration en matière de localisation, d'accessibilité mobile, de cohérence visuelle et de bonnes pratiques de sécurité.

Ce rapport documente les problèmes identifiés et les corrections appliquées directement sur la branche `main`.

---

## 2. Problèmes critiques identifiés et corrigés

### 2.1 Localisation et branding

| Problème | Gravité | Correction |
|:---------|:--------|:-----------|
| `<html lang="en">` au lieu de `"fr"` | Haute | Corrigé dans `__root.tsx` |
| Métadonnées "Lovable App" / "Lovable Generated Project" | Haute | Remplacées par les métadonnées ANSUT officielles |
| Pages 404 et erreur en anglais | Moyenne | Traduites intégralement en français |
| Twitter `@Lovable` dans les meta OG | Basse | Remplacé par `@ansut_ci` |

### 2.2 Accessibilité mobile

| Problème | Gravité | Correction |
|:---------|:--------|:-----------|
| Sidebar desktop uniquement (`hidden md:flex`), aucune navigation mobile | Haute | Ajout d'un menu drawer mobile avec overlay et bouton hamburger |
| Breadcrumb tronqué sur petit écran | Moyenne | Masquage adaptatif des éléments non essentiels |
| Bouton "Site public" invisible sur mobile | Basse | Masqué sur xs, accessible via menu |

### 2.3 Cohérence visuelle du cockpit

| Problème | Gravité | Correction |
|:---------|:--------|:-----------|
| Pages events, checkin, registrations avec design utilitaire basique | Moyenne | Refonte complète avec compteurs, badges sémantiques, loading states |
| Page admin.setup non alignée avec le design system | Basse | Refonte avec card-elevated et états visuels cohérents |
| Pages events.new / events.$id.edit sans structure visuelle | Moyenne | Ajout d'en-têtes avec icônes, cards encadrées, loading spinner |
| Composant ComingSoon minimal | Basse | Ajout d'un CTA de retour et d'un design plus informatif |

### 2.4 Design system et typographie

| Problème | Gravité | Correction |
|:---------|:--------|:-----------|
| `font-size: 14px` trop petit pour l'inclusion sociale | Moyenne | Augmenté à 15px |
| `line-height: 1.6` insuffisant | Basse | Augmenté à 1.65 |
| `section-gap` trop serré (1rem / 1.5rem) | Basse | Augmenté à 1.25rem / 1.75rem |
| Button avec `rounded-md` et `transition-colors` seulement | Basse | Passage à `rounded-lg`, `transition-all duration-150`, focus ring amélioré |
| Input avec `h-9` trop compact | Moyenne | Passage à `h-10`, `rounded-lg`, focus ring avec border-primary |
| Newsletter-form avec titre dupliqué par rapport à la section parente | Basse | Suppression du titre interne |

---

## 3. Problèmes identifiés mais non corrigés (recommandations)

### 3.1 Sécurité

**Clé Supabase anon dans le code client.** La clé `VITE_SUPABASE_ANON_KEY` est exposée côté client, ce qui est le comportement attendu par Supabase (Row Level Security). Cependant, il est recommandé de vérifier que les RLS policies sont correctement configurées pour chaque table, en particulier `event_registrations` et `profiles`.

**Absence de rate limiting sur les RPC publiques.** Les fonctions `register_for_event` et `check_in_registration` sont appelables sans authentification. Un rate limiting côté Supabase Edge Functions ou un CAPTCHA serait souhaitable pour éviter les abus.

### 3.2 Architecture

**Absence de gestion d'état globale pour les données.** Le pattern `useEffect + useState` est répété dans chaque page cockpit. L'adoption de TanStack Query (déjà installé mais non utilisé pour les données Supabase) permettrait le caching, la revalidation automatique et la déduplication des requêtes.

**Slug auto-généré uniquement à la création.** La logique `if (k === "name" && !isEdit && !prev.slug)` signifie que le slug ne se met à jour que si le champ est vide lors de la création. Si l'utilisateur efface le slug puis modifie le nom, il ne se régénère pas. Une logique plus robuste serait de régénérer tant que l'utilisateur n'a pas manuellement modifié le slug.

### 3.3 UX et inclusion sociale

**Modules placeholder exposés dans la navigation.** Les routes `/participants` et `/polls` affichent un composant "Bientôt disponible" mais sont visibles dans la sidebar. Il serait préférable de les masquer ou de les marquer visuellement comme indisponibles pour éviter la frustration utilisateur.

**Absence de mode sombre complet testé.** Les tokens dark mode sont définis mais l'interface ne propose pas de toggle. Si le mode sombre est activé par le système, certaines combinaisons de couleurs (notamment les badges de statut) pourraient manquer de contraste.

**Formulaire d'événement sans validation inline.** Contrairement au formulaire d'inscription publique (`e.$slug.tsx`) qui utilise Zod avec des messages explicites, le formulaire d'événement côté admin ne valide que via des toasts globaux. Une validation inline améliorerait l'UX.

### 3.4 Performance

**Chargement de toutes les inscriptions côté client.** La page `registrations` charge l'intégralité des inscriptions d'un événement (`select("*")`) puis pagine côté client. Pour des événements à forte affluence (1000+ participants), il serait préférable d'utiliser la pagination Supabase (`.range()`).

---

## 4. Fichiers modifiés dans ce commit

| Fichier | Nature de la modification |
|:--------|:------------------------|
| `src/styles.css` | Typographie, focus-visible, section-gap |
| `src/components/ui/button.tsx` | Transitions, border-radius, focus ring |
| `src/components/ui/input.tsx` | Hauteur, border-radius, focus ring |
| `src/components/coming-soon.tsx` | Design complet avec CTA retour |
| `src/components/event-form.tsx` | Fieldsets, helpers, espacement |
| `src/components/newsletter-form.tsx` | Suppression titre dupliqué |
| `src/routes/__root.tsx` | Localisation fr, métadonnées ANSUT, 404/erreur en français |
| `src/routes/_authenticated.tsx` | Menu mobile drawer, loading amélioré |
| `src/routes/_authenticated/events.tsx` | Compteurs, badges sémantiques, loading state |
| `src/routes/_authenticated/checkin.tsx` | Overlay viseur, feedback enrichi, historique amélioré |
| `src/routes/_authenticated/events.$id.registrations.tsx` | Stats rapides, badges colorés, responsive |
| `src/routes/_authenticated/events.new.tsx` | En-tête avec icône, card encadrée |
| `src/routes/_authenticated/events.$id.edit.tsx` | En-tête avec icône, card encadrée |
| `src/routes/_authenticated/admin.setup.tsx` | Design cohérent avec états visuels |

---

## 5. Conclusion

Le projet est sur une trajectoire positive avec un design system bien pensé et une architecture SSR moderne. Les corrections apportées dans ce commit adressent les problèmes les plus visibles en matière de localisation, d'accessibilité mobile et de cohérence visuelle. Les recommandations de la section 3 constituent la feuille de route pour les prochaines itérations.
