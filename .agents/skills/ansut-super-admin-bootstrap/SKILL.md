---
name: ansut-super-admin-bootstrap
description: Bootstrap automatique du rôle super_admin pour les comptes DG ANSUT (psomet@ansut.ci) via une liste blanche d'emails — applique le rôle à l'inscription ET rétroactivement, sans jamais stocker de mot de passe.
type: feature
---

# ANSUT — Bootstrap super_admin DG

Le DG ANSUT (par défaut `psomet@ansut.ci`) doit **toujours** être `super_admin` dans tout projet ANSUT, sans intervention manuelle après son inscription.

## 1. Principe (non négociable)

- **Aucun mot de passe stocké** dans le code ou les migrations. Jamais. Le mot de passe vit uniquement dans le gestionnaire d'auth Supabase (hashé) et chez le DG.
- **Liste blanche d'emails** dans une table dédiée `public.super_admin_bootstrap_emails`.
- **Promotion automatique** dans la fonction `public.handle_new_user()` déjà déclenchée par l'intégration sur `auth.users` (on n'ajoute jamais de trigger directement sur `auth.*`).
- **Promotion rétroactive** idempotente dans la même migration pour couvrir les comptes déjà créés.

## 2. Migration canonique

```sql
-- 1. Table liste blanche (emails uniquement)
CREATE TABLE IF NOT EXISTS public.super_admin_bootstrap_emails (
  email text PRIMARY KEY,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.super_admin_bootstrap_emails TO authenticated;
GRANT ALL    ON public.super_admin_bootstrap_emails TO service_role;
ALTER TABLE public.super_admin_bootstrap_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins read bootstrap list"
  ON public.super_admin_bootstrap_emails;
CREATE POLICY "Super admins read bootstrap list"
  ON public.super_admin_bootstrap_emails
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 2. Seed des comptes DG (compléter si besoin)
INSERT INTO public.super_admin_bootstrap_emails (email, note) VALUES
  ('psomet@ansut.ci', 'DG ANSUT — auto super_admin')
ON CONFLICT (email) DO NOTHING;

-- 3. Étendre handle_new_user (NE JAMAIS créer un nouveau trigger sur auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  IF EXISTS (
    SELECT 1 FROM public.super_admin_bootstrap_emails
    WHERE lower(email) = lower(NEW.email)
  ) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'super_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin');
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Rattrapage rétroactif (idempotent — sans effet si le user n'existe pas encore)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
JOIN public.super_admin_bootstrap_emails w ON lower(w.email) = lower(u.email)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = u.id AND r.role = 'super_admin'
);
```

## 3. Pré-requis dans le projet cible

- Enum `app_role` avec la valeur `super_admin`.
- Table `public.user_roles (user_id uuid, role app_role)`.
- Fonction `public.has_role(uuid, app_role)` en `SECURITY DEFINER`.
- Trigger `on_auth_user_created` (géré par l'intégration Supabase) qui appelle `public.handle_new_user()`.

Si l'un manque, déployer d'abord la skill `lovable-supabase-auth`.

## 4. Procédure côté DG

1. Le DG ouvre `/signup` et s'inscrit avec son email officiel ANSUT.
2. Dès la création du compte (et la confirmation email si activée), il est `super_admin` automatiquement.
3. Aucun script de promotion manuelle à exécuter.

## 5. Ajouter ou retirer un compte DG plus tard

Via un nouveau migration :

```sql
-- Ajouter
INSERT INTO public.super_admin_bootstrap_emails (email, note)
VALUES ('nouveau.dg@ansut.ci', 'Nouveau DG')
ON CONFLICT (email) DO NOTHING;

-- Retirer (la révocation du rôle se fait séparément)
DELETE FROM public.super_admin_bootstrap_emails WHERE email = 'ancien.dg@ansut.ci';
DELETE FROM public.user_roles r USING auth.users u
  WHERE r.user_id = u.id AND lower(u.email) = 'ancien.dg@ansut.ci' AND r.role = 'super_admin';
```

## 6. Hard rules

1. **Aucun mot de passe** dans le repo, les migrations, les seeds, les skills. Le mot de passe se gère via Supabase Auth (réinitialisation par email) uniquement.
2. **Pas de trigger sur `auth.users`** — toujours étendre la fonction `public.handle_new_user()`.
3. **Comparaison d'emails en `lower()`** des deux côtés (auth.users stocke en lowercase, mais on protège quand même).
4. **Idempotence obligatoire** : la migration doit pouvoir tourner plusieurs fois sans dupliquer de rôle (`NOT EXISTS` ou `ON CONFLICT`).
5. **Rétroactivité obligatoire** : un compte déjà existant au moment du déploiement doit être promu sans intervention.
6. **RLS sur la liste blanche** : seuls les super_admin déjà en place peuvent la lire. Personne ne peut l'écrire depuis le client (write réservé aux migrations + service_role).
7. **Audit** : la colonne `note` documente pourquoi un email est dans la liste — toujours la remplir.
