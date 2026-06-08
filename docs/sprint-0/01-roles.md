# J1 — Cartographie des rôles

Source enum `public.app_role` : `participant, staff, sponsor, org_admin, super_admin`.
Croisé avec les policies RLS validées en S4 / S4-bis pour garantir cohérence **UX ↔ sécurité**.

## Vue synthétique

| Rôle | Périmètre | Première vue | Tâche principale | Ne doit jamais voir |
|---|---|---|---|---|
| **Participant** | Soi, dans un événement | Accueil événement (`/e/:slug`) | Vivre l'événement (agenda, networking, vote) | Données autres participants hors annuaire, données admin, exports, RLS, audit |
| **Staff** | Événement assigné | Check-in (`/checkin`) | Accueil terrain, scan badges, support | Exports financiers, sécurité, configuration événement, autres organisations |
| **Sponsor** | Soi + leads attribués | Accueil événement + page sponsor | Récupérer leads, publier contenu sponsorisé | Données participants non opt-in, admin, autres sponsors, exports globaux |
| **Org Admin** | Son organisation uniquement | Dashboard organisation | Préparer & piloter ses événements | Autres organisations, super-admin, bootstrap, audit plateforme |
| **Super Admin** | Plateforme globale | Dashboard plateforme | Gouvernance multi-org, sécurité, audit | (rien — accès global validé S4) |

## Matrice détaillée

### Participant
| Domaine | Voit | Fait | Interdit |
|---|---|---|---|
| Profil | Sien | Édite, badge | Profils non opt-in annuaire |
| Événement | Programme publié | Marque session, bookmark | Sessions `draft` (S4b-A) |
| Networking | Annuaire opt-in | Connecte, message, RDV | Liste exhaustive participants |
| Annonces | Annonces publiées | Lit | Brouillons, écriture |
| Sondages | Polls actifs | Vote | Résultats avant clôture (si configuré) |
| Messagerie | Ses conversations | Envoie | Conversations tierces |

### Staff
| Domaine | Voit | Fait | Interdit |
|---|---|---|---|
| Check-in | Liste inscrits événement assigné | Scan, valide présence | Écriture profil participant |
| Participants | Annuaire complet événement | Lit, search | Suppression, modification rôle |
| Annonces | Publiées + brouillons événement | (lecture) | Publication (sauf délégation explicite) |
| Support | Tickets terrain | Répond | Données autres événements |

### Sponsor
| Domaine | Voit | Fait | Interdit |
|---|---|---|---|
| Profil sponsor | Sien, page publique | Édite contenu sponsorisé | Édition d'autres sponsors |
| Leads | Leads opt-in scan badge | Exporte ses leads | Annuaire complet, contacts non opt-in |
| Stand virtuel | Sa fiche | Publie | Stands tiers |
| Messagerie | Conversations entrantes opt-in | Répond | Démarchage non opt-in |

### Org Admin
| Domaine | Voit | Fait | Interdit |
|---|---|---|---|
| Événements | Ceux de `current_user_org()` | CRUD complet | Événements autres orgs (S4-B) |
| Participants | Inscrits ses événements | Valide, exporte | Participants autres orgs |
| Programme | Sessions/speakers ses événements | CRUD (S4b-D) | Programme autres orgs |
| Communication | Annonces & polls ses événements | Publie (S4-B, S4-C) | Communication autres orgs |
| Organisation | Sa fiche | Édite (S4b-C) | Autres organisations |
| Exports | Données son org | CSV, PDF | Exports plateforme |

### Super Admin
| Domaine | Voit | Fait | Interdit |
|---|---|---|---|
| Tout | Toutes orgs, tous events | CRUD global | — |
| Sécurité | Audit trail, security runs | Lance scans | — |
| Rôles | `user_roles` global | Attribue rôles | (M4-D différée : pas encore scopable par org) |
| Bootstrap | `super_admin_bootstrap_emails` | Gère liste | — |

## Anomalies UX/sécurité détectées

1. **Pas de rôle Sponsor dans l'UI** — enum DB existe, mais aucune route ni navigation dédiée. À spécifier en J3.
2. **Staff sans home dédiée** — actuellement Staff arrive sur `/dashboard` admin (vue Org Admin réduite). Devrait atterrir sur `/checkin`.
3. **`me.role` route existe** mais comportement post-login non normalisé selon les 5 rôles — à clarifier en J2.
4. **Org Admin & Super Admin partagent `/dashboard`** sans variante visuelle claire du périmètre.
