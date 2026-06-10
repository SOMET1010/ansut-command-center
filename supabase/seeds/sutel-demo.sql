-- =====================================================================
-- Seed J5 — SUTEL Demo 2026 (Option A, validée comité produit)
-- =====================================================================
-- Objectif : peupler un événement réaliste pour tester la NAVIGATION
-- (Phase 4.1 Lot 1), pas pour simuler des fonctionnalités absentes.
--
-- Aucune table créée. Aucune modification de schéma. Aucune RLS touchée.
-- Script idempotent : ré-exécutable sans dupliquer (purge le périmètre
-- du slug 'sutel-demo-2026' avant insertion).
--
-- Périmètre :
--   1 org ANSUT  •  1 événement 2 jours
--   25 participants (ministères / opérateurs / startups / universités /
--      institutions ; dont quelques exposant + sponsor pour annuaire)
--   12 speakers  •  15 sessions  •  6 annonces (3 épinglées)
--   3 sondages actifs  •  10 rendez-vous planifiés
--
-- Exécution :
--   psql "$SUPABASE_DB_URL" -f supabase/seeds/sutel-demo.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Purge périmètre demo (cascade fait le reste via les FK ON DELETE)
-- ---------------------------------------------------------------------
DELETE FROM public.events WHERE slug = 'sutel-demo-2026';
-- l'organisation est conservée si elle existe déjà (réutilisée)

-- ---------------------------------------------------------------------
-- 1. Organisation ANSUT + Événement SUTEL
-- ---------------------------------------------------------------------
INSERT INTO public.organizations (id, name, slug, primary_color)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'ANSUT',
  'ansut',
  '#0B6E4F'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.events (
  id, organization_id, name, slug, description, location,
  starts_at, ends_at, capacity, status,
  wifi_ssid, wifi_password, wifi_encryption
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'SUTEL 2026 — Salon des Usages et Technologies numériques',
  'sutel-demo-2026',
  'Rendez-vous national de l''écosystème télécoms et numérique ivoirien : 2 jours de conférences, démonstrations et networking au Sofitel Hôtel Ivoire d''Abidjan.',
  'Sofitel Hôtel Ivoire — Abidjan, Cocody',
  (CURRENT_DATE + INTERVAL '7 days')::timestamptz + INTERVAL '8 hours',
  (CURRENT_DATE + INTERVAL '8 days')::timestamptz + INTERVAL '18 hours',
  500,
  'published',
  'SUTEL2026',
  'Abidjan2026',
  'WPA'
);

-- ---------------------------------------------------------------------
-- 2. Participants (25) — réalistes, catégorisés
--    categories : ministere · operateur · startup · universite ·
--                 institution · exposant · sponsor
-- ---------------------------------------------------------------------
INSERT INTO public.event_registrations
  (event_id, full_name, email, phone, organization, position,
   country, participant_category, bio, interests, is_visible_in_directory, status)
VALUES
  -- Ministères (4)
  ('22222222-2222-2222-2222-222222222222', 'Aïssata Koné',          'a.kone@telecom.gouv.ci',  '+225 07 11 22 01', 'Ministère de la Communication et de l''Économie numérique', 'Directrice de cabinet adjointe',     'Côte d''Ivoire', 'ministere',  'En charge des politiques publiques de transformation numérique.', ARRAY['politique numérique','souveraineté','identité numérique'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Mamadou Traoré',        'm.traore@telecom.gouv.ci','+225 07 11 22 02', 'Ministère de la Communication et de l''Économie numérique', 'Conseiller technique',               'Côte d''Ivoire', 'ministere',  'Spécialiste régulation et large bande.', ARRAY['régulation','large bande','5G'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Brigitte Yao',          'b.yao@enseignement.gouv.ci','+225 07 11 22 03','Ministère de l''Enseignement supérieur',                     'Sous-directrice innovation',         'Côte d''Ivoire', 'ministere',  'Pont entre recherche académique et industrie.', ARRAY['recherche','innovation','universités'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Kouadio N''Guessan',    'k.nguessan@economie.gouv.ci','+225 07 11 22 04','Ministère de l''Économie et des Finances',                  'Chargé de mission digitalisation',   'Côte d''Ivoire', 'ministere',  'E-services aux entreprises.', ARRAY['e-gouv','fiscalité numérique'], true, 'confirmed'),

  -- Opérateurs télécoms (4)
  ('22222222-2222-2222-2222-222222222222', 'Sékou Bamba',           's.bamba@orange.ci',       '+225 07 22 33 01', 'Orange Côte d''Ivoire',                                  'Directeur réseaux',                   'Côte d''Ivoire', 'operateur',  'Déploiement fibre et 5G sur Abidjan et l''intérieur.', ARRAY['5G','fibre','infrastructure'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Fatou Diabaté',         'f.diabate@mtn.ci',        '+225 07 22 33 02', 'MTN Côte d''Ivoire',                                     'Head of B2B',                         'Côte d''Ivoire', 'operateur',  'Solutions entreprises et IoT.', ARRAY['B2B','IoT','cloud'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Ibrahim Sangaré',       'i.sangare@moov-africa.ci','+225 07 22 33 03', 'Moov Africa Côte d''Ivoire',                             'Directeur innovation',                'Côte d''Ivoire', 'operateur',  'Mobile money et services digitaux.', ARRAY['mobile money','fintech'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Awa Coulibaly',         'a.coulibaly@artci.ci',    '+225 07 22 33 04', 'ARTCI — Autorité de Régulation',                         'Cheffe de département spectre',       'Côte d''Ivoire', 'institution','Gestion du spectre et licences.', ARRAY['spectre','régulation','licences'], true, 'confirmed'),

  -- Startups (5)
  ('22222222-2222-2222-2222-222222222222', 'Yann Kouassi',          'yann@waribei.ci',         '+225 05 44 55 01', 'Waribei',                                                'CEO & co-fondateur',                  'Côte d''Ivoire', 'startup',    'Plateforme de logistique urbaine pour PME ivoiriennes.', ARRAY['logistique','PME','livraison'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Aminata Cissé',         'aminata@djamo.ci',        '+225 05 44 55 02', 'Djamo',                                                  'Head of Product',                     'Côte d''Ivoire', 'startup',    'Néobanque mobile pour les jeunes actifs.', ARRAY['fintech','UX mobile'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'David Akpa',            'david@anka-ai.com',       '+225 05 44 55 03', 'Anka AI',                                                'CTO',                                 'Côte d''Ivoire', 'startup',    'NLP pour langues ouest-africaines.', ARRAY['IA','NLP','langues locales'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Nadège Brou',           'n.brou@susu.ci',          '+225 05 44 55 04', 'Susu',                                                   'Founder',                             'Côte d''Ivoire', 'startup',    'Tontine numérique pour le secteur informel.', ARRAY['inclusion financière','tontine','UX'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Patrick Yao',           'patrick@kifri.com',       '+225 05 44 55 05', 'Kifri',                                                  'CEO',                                 'Côte d''Ivoire', 'startup',    'Marketplace agritech producteurs ↔ distributeurs.', ARRAY['agritech','supply chain'], true, 'confirmed'),

  -- Universités (3)
  ('22222222-2222-2222-2222-222222222222', 'Pr. Konan Bertin',      'k.bertin@inphb.ci',       '+225 01 66 77 01', 'INP-HB Yamoussoukro',                                    'Professeur, directeur de laboratoire','Côte d''Ivoire', 'universite', 'Recherche en cybersécurité appliquée.', ARRAY['cybersécurité','recherche','formation'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Dr. Mireille Ahou',     'm.ahou@univ-fhb.ci',      '+225 01 66 77 02', 'Université Félix Houphouët-Boigny',                      'Maîtresse de conférences',            'Côte d''Ivoire', 'universite', 'Sociologie des usages numériques.', ARRAY['usages numériques','inclusion','genre'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Pr. Bakary Touré',      'b.toure@esatic.ci',       '+225 01 66 77 03', 'ESATIC',                                                 'Directeur scientifique',              'Côte d''Ivoire', 'universite', 'Réseaux et infrastructures critiques.', ARRAY['réseaux','infrastructure','5G'], true, 'confirmed'),

  -- Institutions / partenaires (2)
  ('22222222-2222-2222-2222-222222222222', 'Marie-Louise Adjoua',   'ml.adjoua@gizmo-pme.org', '+225 21 88 99 01', 'Agence CI PME',                                          'Directrice accompagnement',           'Côte d''Ivoire', 'institution','Accompagnement des PME à la transformation numérique.', ARRAY['PME','accompagnement','financement'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Eugène Kpan',           'e.kpan@afd.fr',           '+33 1 53 44 31 31','Agence Française de Développement',                      'Chargé de mission numérique',         'France',         'institution','Financement projets numériques en Afrique de l''Ouest.', ARRAY['financement','coopération','numérique'], true, 'confirmed'),

  -- Exposants (5) — visibles dans l'annuaire Participants
  ('22222222-2222-2222-2222-222222222222', 'Hervé Dembélé',         'h.dembele@huawei.com',    '+225 27 22 44 01', 'Huawei Côte d''Ivoire',                                  'Country manager',                     'Côte d''Ivoire', 'exposant',   'Stand A12 — équipements 5G et solutions cloud.', ARRAY['5G','cloud','équipement'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Sylvie Konaté',         's.konate@cisco.com',      '+225 27 22 44 02', 'Cisco Africa',                                           'Sales engineer',                      'Côte d''Ivoire', 'exposant',   'Stand A14 — sécurité réseau et SD-WAN.', ARRAY['cybersécurité','SD-WAN','enterprise'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Olivier Tagro',         'o.tagro@inwi.ci',         '+225 27 22 44 03', 'INWI Côte d''Ivoire',                                    'Responsable partenariats',            'Côte d''Ivoire', 'exposant',   'Stand B07 — offres B2B et IoT.', ARRAY['B2B','IoT'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Christelle Aké',        'c.ake@dataprotect.ci',    '+225 27 22 44 04', 'Dataprotect',                                            'COO',                                 'Côte d''Ivoire', 'exposant',   'Stand B11 — audit et conformité (RGPD, LPDP).', ARRAY['conformité','cybersécurité','audit'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Ali Maïga',             'a.maiga@smile.ci',        '+225 27 22 44 05', 'Smile CI',                                               'Directeur technique',                 'Côte d''Ivoire', 'exposant',   'Stand B13 — intégration open source.', ARRAY['open source','intégration','dev'], true, 'confirmed'),

  -- Sponsors (2) — visibles dans l'annuaire Participants
  ('22222222-2222-2222-2222-222222222222', 'Édith N''Doumi',        'e.ndoumi@bicici.ci',      '+225 27 20 30 40 01','BICICI — Sponsor Or',                                  'Directrice marketing',                'Côte d''Ivoire', 'sponsor',    'Sponsor Or de SUTEL 2026.', ARRAY['banque','sponsoring'], true, 'confirmed'),
  ('22222222-2222-2222-2222-222222222222', 'Jean-Marc Gnaoré',      'jm.gnaore@nsia.ci',       '+225 27 20 30 40 02','NSIA — Sponsor Argent',                                'Directeur communication',             'Côte d''Ivoire', 'sponsor',    'Sponsor Argent de SUTEL 2026.', ARRAY['assurance','sponsoring'], true, 'confirmed');

-- ---------------------------------------------------------------------
-- 3. Speakers (12)
-- ---------------------------------------------------------------------
INSERT INTO public.event_speakers (id, event_id, full_name, title, organization, bio)
VALUES
  ('33333333-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Aïssata Koné',       'Directrice de cabinet adjointe',   'Ministère de la Communication',                'Politiques publiques numériques.'),
  ('33333333-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Pr. Bakary Touré',   'Directeur scientifique',           'ESATIC',                                       'Réseaux et infrastructures critiques.'),
  ('33333333-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','Sékou Bamba',        'Directeur réseaux',                'Orange Côte d''Ivoire',                        'Déploiement 5G et fibre.'),
  ('33333333-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','Awa Coulibaly',      'Cheffe de département spectre',    'ARTCI',                                        'Régulation et licences.'),
  ('33333333-0000-0000-0000-000000000005','22222222-2222-2222-2222-222222222222','Aminata Cissé',      'Head of Product',                  'Djamo',                                        'Néobanque africaine.'),
  ('33333333-0000-0000-0000-000000000006','22222222-2222-2222-2222-222222222222','David Akpa',         'CTO',                              'Anka AI',                                      'IA et langues ouest-africaines.'),
  ('33333333-0000-0000-0000-000000000007','22222222-2222-2222-2222-222222222222','Pr. Konan Bertin',   'Professeur',                       'INP-HB Yamoussoukro',                          'Cybersécurité appliquée.'),
  ('33333333-0000-0000-0000-000000000008','22222222-2222-2222-2222-222222222222','Christelle Aké',     'COO',                              'Dataprotect',                                  'Conformité et audit.'),
  ('33333333-0000-0000-0000-000000000009','22222222-2222-2222-2222-222222222222','Hervé Dembélé',      'Country manager',                  'Huawei',                                       'Solutions cloud et 5G.'),
  ('33333333-0000-0000-0000-000000000010','22222222-2222-2222-2222-222222222222','Marie-Louise Adjoua','Directrice accompagnement',        'Agence CI PME',                                'Accompagnement PME.'),
  ('33333333-0000-0000-0000-000000000011','22222222-2222-2222-2222-222222222222','Eugène Kpan',        'Chargé de mission numérique',      'AFD',                                          'Financement projets numériques.'),
  ('33333333-0000-0000-0000-000000000012','22222222-2222-2222-2222-222222222222','Dr. Mireille Ahou',  'Maîtresse de conférences',         'Université FHB',                               'Sociologie des usages numériques.');

-- ---------------------------------------------------------------------
-- 4. Sessions (15 sur 2 jours)
--    J1 : 8 sessions  •  J2 : 7 sessions
-- ---------------------------------------------------------------------
WITH ev AS (SELECT starts_at::date AS d1 FROM public.events WHERE id='22222222-2222-2222-2222-222222222222')
INSERT INTO public.event_sessions
  (id, event_id, title, description, session_type, track, location, starts_at, ends_at, sort_order)
SELECT * FROM (VALUES
  -- J1
  ('44444444-0000-0000-0000-000000000001'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Cérémonie d''ouverture SUTEL 2026',                 'Allocutions officielles et présentation du programme.',                          'keynote',   'Plénière',   'Salle plénière — Grand auditorium', (SELECT d1 FROM ev)::timestamptz + INTERVAL '8 hours 30 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '9 hours 30 minutes',  1),
  ('44444444-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Souveraineté numérique africaine : où en est-on ?', 'Panel d''ouverture sur les enjeux de souveraineté.',                              'panel',     'Stratégie',  'Salle plénière — Grand auditorium', (SELECT d1 FROM ev)::timestamptz + INTERVAL '9 hours 45 minutes',  (SELECT d1 FROM ev)::timestamptz + INTERVAL '11 hours 0 minutes',  2),
  ('44444444-0000-0000-0000-000000000003'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Déploiement 5G en Côte d''Ivoire : retours terrain','Présentations croisées des opérateurs et de l''ARTCI.',                          'panel',     'Infra',      'Salle Akwaba 1',                    (SELECT d1 FROM ev)::timestamptz + INTERVAL '11 hours 15 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '12 hours 15 minutes', 3),
  ('44444444-0000-0000-0000-000000000004'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'IA générative pour le service public',              'Cas d''usage, garde-fous éthiques et coûts.',                                    'panel',     'IA',         'Salle Baoulé',                      (SELECT d1 FROM ev)::timestamptz + INTERVAL '11 hours 15 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '12 hours 15 minutes', 4),
  ('44444444-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Pitch startups — session 1',                        'Cinq startups numériques ivoiriennes : 5 min chacune + Q&R.',                    'workshop',  'Startup',    'Salle Yopougon',                    (SELECT d1 FROM ev)::timestamptz + INTERVAL '14 hours 0 minutes',  (SELECT d1 FROM ev)::timestamptz + INTERVAL '15 hours 30 minutes', 5),
  ('44444444-0000-0000-0000-000000000006'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Cybersécurité : protéger les infrastructures critiques','État de la menace et bonnes pratiques.',                                       'panel',     'Cybersec',   'Salle Akwaba 1',                    (SELECT d1 FROM ev)::timestamptz + INTERVAL '14 hours 0 minutes',  (SELECT d1 FROM ev)::timestamptz + INTERVAL '15 hours 15 minutes', 6),
  ('44444444-0000-0000-0000-000000000007'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Atelier RGPD / LPDP — mise en conformité',          'Atelier pratique pour DPO et responsables sécurité.',                            'workshop',  'Conformité', 'Salle Baoulé',                      (SELECT d1 FROM ev)::timestamptz + INTERVAL '15 hours 45 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '17 hours 15 minutes', 7),
  ('44444444-0000-0000-0000-000000000008'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Networking cocktail — Jour 1',                      'Cocktail dînatoire ouvert à tous les inscrits.',                                 'networking','Networking', 'Terrasse Ébrié',                    (SELECT d1 FROM ev)::timestamptz + INTERVAL '18 hours 0 minutes',  (SELECT d1 FROM ev)::timestamptz + INTERVAL '20 hours 0 minutes',  8),
  -- J2
  ('44444444-0000-0000-0000-000000000009'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Keynote : la fintech ouest-africaine en 2030',      'Vision prospective et signaux faibles.',                                         'keynote',   'Fintech',    'Salle plénière — Grand auditorium', (SELECT d1 FROM ev)::timestamptz + INTERVAL '32 hours 30 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '33 hours 30 minutes', 9),
  ('44444444-0000-0000-0000-000000000010'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Mobile money : interopérabilité et coûts',          'Discussion entre opérateurs et banques.',                                        'panel',     'Fintech',    'Salle Akwaba 1',                    (SELECT d1 FROM ev)::timestamptz + INTERVAL '33 hours 45 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '35 hours 0 minutes',  10),
  ('44444444-0000-0000-0000-000000000011'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Cloud souverain : choix d''architecture',           'Quelles options pour héberger des données sensibles ?',                          'panel',     'Cloud',      'Salle Baoulé',                      (SELECT d1 FROM ev)::timestamptz + INTERVAL '33 hours 45 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '35 hours 0 minutes',  11),
  ('44444444-0000-0000-0000-000000000012'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Pitch startups — session 2',                        'Cinq startups numériques : 5 min chacune + Q&R.',                                'workshop',  'Startup',    'Salle Yopougon',                    (SELECT d1 FROM ev)::timestamptz + INTERVAL '35 hours 15 minutes', (SELECT d1 FROM ev)::timestamptz + INTERVAL '36 hours 45 minutes', 12),
  ('44444444-0000-0000-0000-000000000013'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Inclusion numérique : femmes & jeunes',             'Programmes, financements et résultats.',                                         'panel',     'Société',    'Salle Akwaba 1',                    (SELECT d1 FROM ev)::timestamptz + INTERVAL '38 hours 0 minutes',  (SELECT d1 FROM ev)::timestamptz + INTERVAL '39 hours 15 minutes', 13),
  ('44444444-0000-0000-0000-000000000014'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Financer l''innovation numérique africaine',        'AFD, BEI, fonds privés : panorama des dispositifs.',                             'panel',     'Financement','Salle Baoulé',                      (SELECT d1 FROM ev)::timestamptz + INTERVAL '38 hours 0 minutes',  (SELECT d1 FROM ev)::timestamptz + INTERVAL '39 hours 15 minutes', 14),
  ('44444444-0000-0000-0000-000000000015'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Clôture & annonces SUTEL 2027',                     'Bilan, prix du jury, calendrier 2027.',                                          'keynote',   'Plénière',   'Salle plénière — Grand auditorium', (SELECT d1 FROM ev)::timestamptz + INTERVAL '40 hours 0 minutes',  (SELECT d1 FROM ev)::timestamptz + INTERVAL '41 hours 0 minutes',  15)
) AS s;

-- ---------------------------------------------------------------------
-- 5. Liens sessions ↔ speakers
-- ---------------------------------------------------------------------
INSERT INTO public.event_session_speakers (session_id, speaker_id, sort_order, role) VALUES
  ('44444444-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001', 0, 'keynote'),
  ('44444444-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001', 0, 'modératrice'),
  ('44444444-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000004', 1, 'panéliste'),
  ('44444444-0000-0000-0000-000000000003','33333333-0000-0000-0000-000000000003', 0, 'panéliste'),
  ('44444444-0000-0000-0000-000000000003','33333333-0000-0000-0000-000000000004', 1, 'panéliste'),
  ('44444444-0000-0000-0000-000000000003','33333333-0000-0000-0000-000000000009', 2, 'panéliste'),
  ('44444444-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000006', 0, 'keynote'),
  ('44444444-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000005', 0, 'jury'),
  ('44444444-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000011', 1, 'jury'),
  ('44444444-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000007', 0, 'keynote'),
  ('44444444-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000008', 1, 'panéliste'),
  ('44444444-0000-0000-0000-000000000007','33333333-0000-0000-0000-000000000008', 0, 'animatrice'),
  ('44444444-0000-0000-0000-000000000009','33333333-0000-0000-0000-000000000005', 0, 'keynote'),
  ('44444444-0000-0000-0000-000000000010','33333333-0000-0000-0000-000000000005', 0, 'panéliste'),
  ('44444444-0000-0000-0000-000000000011','33333333-0000-0000-0000-000000000002', 0, 'modérateur'),
  ('44444444-0000-0000-0000-000000000011','33333333-0000-0000-0000-000000000009', 1, 'panéliste'),
  ('44444444-0000-0000-0000-000000000012','33333333-0000-0000-0000-000000000006', 0, 'jury'),
  ('44444444-0000-0000-0000-000000000012','33333333-0000-0000-0000-000000000010',1, 'jury'),
  ('44444444-0000-0000-0000-000000000013','33333333-0000-0000-0000-000000000012',0, 'keynote'),
  ('44444444-0000-0000-0000-000000000014','33333333-0000-0000-0000-000000000011',0, 'panéliste'),
  ('44444444-0000-0000-0000-000000000014','33333333-0000-0000-0000-000000000010',1, 'panéliste'),
  ('44444444-0000-0000-0000-000000000015','33333333-0000-0000-0000-000000000001',0, 'clôture');

-- ---------------------------------------------------------------------
-- 6. Annonces (6, dont 3 épinglées)
-- ---------------------------------------------------------------------
INSERT INTO public.event_announcements
  (event_id, title, content, announcement_type, is_pinned, published_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Bienvenue à SUTEL 2026',                  'L''accueil ouvre à 8h. Munissez-vous de votre QR code de badge (onglet Mon Profil).',                                        'info',    true,  now() - INTERVAL '2 days'),
  ('22222222-2222-2222-2222-222222222222', 'Wi-Fi du site',                            'Réseau : SUTEL2026 — Mot de passe : Abidjan2026. Disponible dans toutes les salles.',                                       'info',    true,  now() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'Plan du salon disponible à l''accueil',    'Un plan papier est distribué à l''accueil. Les stands exposants sont dans le hall principal (zones A et B).',               'info',    true,  now() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'Cocktail networking — Jour 1 à 18h',       'Terrasse Ébrié. Tenue de ville. Ouvert à tous les inscrits, sur présentation du badge.',                                  'info',    false, now() - INTERVAL '6 hours'),
  ('22222222-2222-2222-2222-222222222222', 'Changement de salle : panel IA générative','Le panel "IA générative pour le service public" est déplacé en salle Baoulé (capacité doublée).',                            'warning', false, now() - INTERVAL '3 hours'),
  ('22222222-2222-2222-2222-222222222222', 'Pitch startups — votez votre coup de cœur','Trois sondages sont ouverts dans l''onglet Programme pour désigner le prix du public.',                                    'info',    false, now() - INTERVAL '1 hour');

-- ---------------------------------------------------------------------
-- 7. Sondages (3 actifs sur 3 sessions)
-- ---------------------------------------------------------------------
INSERT INTO public.live_polls (session_id, question, poll_type, options, is_active, show_results)
VALUES
  ('44444444-0000-0000-0000-000000000002', 'Quel est le principal frein à la souveraineté numérique en Côte d''Ivoire ?', 'single',
     '[{"id":"a","label":"Manque de compétences locales"},{"id":"b","label":"Coût des infrastructures"},{"id":"c","label":"Cadre réglementaire"},{"id":"d","label":"Dépendance aux acteurs étrangers"}]'::jsonb, true, true),
  ('44444444-0000-0000-0000-000000000005', 'Quelle startup mérite le prix du public — session 1 ?', 'single',
     '[{"id":"waribei","label":"Waribei"},{"id":"djamo","label":"Djamo"},{"id":"ankaai","label":"Anka AI"},{"id":"susu","label":"Susu"},{"id":"kifri","label":"Kifri"}]'::jsonb, true, true),
  ('44444444-0000-0000-0000-000000000006', 'Quelle est votre priorité cybersécurité 2026 ?', 'multi',
     '[{"id":"awareness","label":"Sensibilisation utilisateurs"},{"id":"backup","label":"Sauvegardes / PRA"},{"id":"iam","label":"Gestion des identités"},{"id":"siem","label":"Détection (SIEM/SOC)"},{"id":"conformite","label":"Mise en conformité LPDP"}]'::jsonb, true, true);

-- ---------------------------------------------------------------------
-- 8. Rendez-vous (10 planifiés) — entre participants confirmés
-- ---------------------------------------------------------------------
WITH p AS (
  SELECT id, email FROM public.event_registrations
  WHERE event_id = '22222222-2222-2222-2222-222222222222'
)
INSERT INTO public.event_meetings
  (event_id, requester_id, recipient_id, status, proposed_time, proposed_location, message)
SELECT
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM p WHERE email = req),
  (SELECT id FROM p WHERE email = rec),
  st, pt, ploc, msg
FROM (VALUES
  ('yann@waribei.ci',        'f.diabate@mtn.ci',          'accepted', (CURRENT_DATE + INTERVAL '7 days')::timestamptz + INTERVAL '13 hours',                  'Espace networking — table 4', 'Discussion partenariat logistique B2B.'),
  ('aminata@djamo.ci',       'e.ndoumi@bicici.ci',        'accepted', (CURRENT_DATE + INTERVAL '7 days')::timestamptz + INTERVAL '13 hours 30 minutes',       'Espace networking — table 7', 'Échange autour de l''interopérabilité paiements.'),
  ('david@anka-ai.com',      'k.bertin@inphb.ci',         'accepted', (CURRENT_DATE + INTERVAL '7 days')::timestamptz + INTERVAL '15 hours 30 minutes',       'Salle Yopougon — coin café',  'Collaboration recherche NLP / langues locales.'),
  ('n.brou@susu.ci',         'ml.adjoua@gizmo-pme.org',   'accepted', (CURRENT_DATE + INTERVAL '7 days')::timestamptz + INTERVAL '16 hours',                  'Espace networking — table 2', 'Programme d''accompagnement Susu.'),
  ('patrick@kifri.com',      'e.kpan@afd.fr',             'pending',  (CURRENT_DATE + INTERVAL '8 days')::timestamptz + INTERVAL '10 hours',                  'Espace networking — table 5', 'Recherche de financement Series A.'),
  ('s.bamba@orange.ci',      'm.traore@telecom.gouv.ci',  'accepted', (CURRENT_DATE + INTERVAL '8 days')::timestamptz + INTERVAL '11 hours',                  'Salon VIP',                   'Point trimestriel déploiement 5G.'),
  ('c.ake@dataprotect.ci',   'a.coulibaly@artci.ci',      'pending',  (CURRENT_DATE + INTERVAL '8 days')::timestamptz + INTERVAL '11 hours 30 minutes',       'Espace networking — table 9', 'Mise à jour référentiel conformité.'),
  ('h.dembele@huawei.com',   'b.toure@esatic.ci',         'accepted', (CURRENT_DATE + INTERVAL '8 days')::timestamptz + INTERVAL '14 hours',                  'Stand A12',                   'Partenariat formation 5G ESATIC.'),
  ('i.sangare@moov-africa.ci','jm.gnaore@nsia.ci',        'pending',  (CURRENT_DATE + INTERVAL '8 days')::timestamptz + INTERVAL '15 hours',                  'Espace networking — table 1', 'Offre micro-assurance mobile.'),
  ('o.tagro@inwi.ci',        's.konate@cisco.com',        'accepted', (CURRENT_DATE + INTERVAL '8 days')::timestamptz + INTERVAL '16 hours',                  'Stand A14',                   'Intégration SD-WAN offre B2B.')
) AS m(req, rec, st, pt, ploc, msg);

COMMIT;

-- =====================================================================
-- Récapitulatif (à vérifier après exécution)
-- =====================================================================
-- SELECT 'org'           AS t, COUNT(*) FROM public.organizations WHERE slug='ansut'
-- UNION ALL SELECT 'event',        COUNT(*) FROM public.events WHERE slug='sutel-demo-2026'
-- UNION ALL SELECT 'participants', COUNT(*) FROM public.event_registrations WHERE event_id='22222222-2222-2222-2222-222222222222'
-- UNION ALL SELECT 'speakers',     COUNT(*) FROM public.event_speakers WHERE event_id='22222222-2222-2222-2222-222222222222'
-- UNION ALL SELECT 'sessions',     COUNT(*) FROM public.event_sessions WHERE event_id='22222222-2222-2222-2222-222222222222'
-- UNION ALL SELECT 'annonces',     COUNT(*) FROM public.event_announcements WHERE event_id='22222222-2222-2222-2222-222222222222'
-- UNION ALL SELECT 'sondages',     COUNT(*) FROM public.live_polls p JOIN public.event_sessions s ON s.id=p.session_id WHERE s.event_id='22222222-2222-2222-2222-222222222222'
-- UNION ALL SELECT 'rdv',          COUNT(*) FROM public.event_meetings WHERE event_id='22222222-2222-2222-2222-222222222222';
