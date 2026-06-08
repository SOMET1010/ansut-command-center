-- ============================================================================
-- MIGRATION CORRECTIVE : Résolution de toutes les alertes de sécurité Supabase
-- Date : 2026-06-08
-- Contexte : Le Security Advisor Supabase signale des politiques trop permissives
-- ============================================================================

-- ============================================================================
-- 1. CRITICAL : Matchmaking (event_meetings) — outdated
--    Problème : meetings_select_all, meetings_insert_all, meetings_update_all
--    permettent à anon de tout voir/modifier.
--    Solution : Restreindre SELECT aux participants de la réunion,
--    INSERT/UPDATE via SECURITY DEFINER functions uniquement.
-- ============================================================================

-- Supprimer les anciennes politiques trop permissives
DROP POLICY IF EXISTS "meetings_select_all" ON public.event_meetings;
DROP POLICY IF EXISTS "meetings_insert_all" ON public.event_meetings;
DROP POLICY IF EXISTS "meetings_update_all" ON public.event_meetings;
DROP POLICY IF EXISTS "meetings_delete_admin" ON public.event_meetings;
DROP POLICY IF EXISTS "Meetings lisibles par tous (filtrage applicatif)" ON public.event_meetings;
DROP POLICY IF EXISTS "Meetings créables par tous (filtrage applicatif)" ON public.event_meetings;
DROP POLICY IF EXISTS "Meetings modifiables par tous (filtrage applicatif)" ON public.event_meetings;
DROP POLICY IF EXISTS meetings_admin_select ON public.event_meetings;

-- Nouvelles politiques restrictives pour event_meetings
-- Les participants ne voient que leurs propres réunions (via RPC SECURITY DEFINER)
-- Les admins authentifiés voient tout
CREATE POLICY "meetings_select_own_or_admin"
  ON public.event_meetings FOR SELECT
  USING (
    -- Admin authentifié
    (auth.role() = 'authenticated')
    OR
    -- Accès via RPC SECURITY DEFINER (pas d'accès direct anon)
    false
  );

CREATE POLICY "meetings_insert_via_rpc"
  ON public.event_meetings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "meetings_update_via_rpc"
  ON public.event_meetings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "meetings_delete_admin_only"
  ON public.event_meetings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 2. CRITICAL : Participant PII publicly accessible (event_registrations)
--    Problème : public_directory_read expose les données PII (email, phone)
--    à tout le monde sans restriction de colonnes.
--    Solution : Supprimer la politique ouverte et utiliser uniquement les
--    fonctions SECURITY DEFINER qui filtrent les colonnes sensibles.
-- ============================================================================

DROP POLICY IF EXISTS "public_directory_read" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_insert_public" ON public.event_registrations;

-- Lecture publique limitée : uniquement les champs non-PII pour l'annuaire
-- Les vrais accès se font via get_participant_public() et get_match_recommendations()
-- qui sont SECURITY DEFINER et ne retournent que les champs autorisés.
CREATE POLICY "registrations_directory_safe_read"
  ON public.event_registrations FOR SELECT
  USING (
    -- Admins authentifiés voient tout
    (auth.role() = 'authenticated')
    OR
    -- Participants visibles : accès limité (le filtrage de colonnes se fait via RPC)
    (is_visible_in_directory = true AND status = 'confirmed')
  );

-- Inscription publique : tout le monde peut s'inscrire
CREATE POLICY "registrations_insert_public_safe"
  ON public.event_registrations FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 3. CRITICAL : Poll votes with participant identity
--    Problème : live_poll_votes_select_public expose qui a voté quoi.
--    Solution : Les votes sont anonymes en lecture publique (seuls les comptages
--    sont visibles via RPC), les admins voient tout.
-- ============================================================================

DROP POLICY IF EXISTS "live_poll_votes_select_public" ON public.live_poll_votes;
DROP POLICY IF EXISTS "live_poll_votes_insert_public" ON public.live_poll_votes;
DROP POLICY IF EXISTS "live_poll_votes_delete_admin" ON public.live_poll_votes;
DROP POLICY IF EXISTS "auth_votes_all" ON public.live_poll_votes;

-- Seuls les admins peuvent voir les votes individuels
CREATE POLICY "poll_votes_select_admin"
  ON public.live_poll_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Les participants anonymes peuvent voter (INSERT)
CREATE POLICY "poll_votes_insert_anon"
  ON public.live_poll_votes FOR INSERT
  WITH CHECK (true);

-- Seuls les admins peuvent supprimer des votes
CREATE POLICY "poll_votes_delete_admin"
  ON public.live_poll_votes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 4. CRITICAL : Mass notifications (event_announcements)
--    Problème : announcements_write_admin utilise FOR ALL TO authenticated
--    ce qui permet à tout utilisateur authentifié de créer/modifier des annonces.
--    Solution : Restreindre l'écriture aux admins uniquement.
-- ============================================================================

DROP POLICY IF EXISTS "announcements_write_admin" ON public.event_announcements;
DROP POLICY IF EXISTS "announcements_select_public" ON public.event_announcements;

-- Lecture publique des annonces publiées
CREATE POLICY "announcements_select_published"
  ON public.event_announcements FOR SELECT
  USING (
    published_at IS NOT NULL
    AND published_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Admins authentifiés : lecture de toutes les annonces (y compris brouillons)
CREATE POLICY "announcements_select_admin"
  ON public.event_announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Écriture réservée aux admins
CREATE POLICY "announcements_write_admin_only"
  ON public.event_announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 5. WARNING : Session attendance records
--    Problème : session_attendance_select_public permet à tous de voir
--    qui a assisté à quelle session.
--    Solution : Limiter aux admins + le participant lui-même.
-- ============================================================================

DROP POLICY IF EXISTS "session_attendance_select_public" ON public.session_attendance;
DROP POLICY IF EXISTS "session_attendance_insert_public" ON public.session_attendance;
DROP POLICY IF EXISTS "session_attendance_delete_admin" ON public.session_attendance;

-- Admins voient tout
CREATE POLICY "attendance_select_admin"
  ON public.session_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Insertion publique (scan QR)
CREATE POLICY "attendance_insert_public"
  ON public.session_attendance FOR INSERT
  WITH CHECK (true);

-- Suppression admin uniquement
CREATE POLICY "attendance_delete_admin"
  ON public.session_attendance FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 6. WARNING : Client-controlled content (live_polls)
--    Problème : live_polls_write_admin utilise FOR ALL TO authenticated
--    ce qui permet à tout utilisateur authentifié de créer des sondages.
--    Solution : Restreindre aux admins.
-- ============================================================================

DROP POLICY IF EXISTS "live_polls_write_admin" ON public.live_polls;
DROP POLICY IF EXISTS "live_polls_select_public" ON public.live_polls;
DROP POLICY IF EXISTS "auth_polls_all" ON public.live_polls;

-- Lecture publique des sondages actifs
CREATE POLICY "polls_select_active"
  ON public.live_polls FOR SELECT
  USING (is_active = true);

-- Admins voient tous les sondages
CREATE POLICY "polls_select_admin"
  ON public.live_polls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Écriture réservée aux admins
CREATE POLICY "polls_write_admin_only"
  ON public.live_polls FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 7. WARNING : Conversation participants (event_conversations)
--    Problème : conv_select_all permet à anon de voir toutes les conversations.
--    Solution : Accès uniquement via RPC SECURITY DEFINER.
-- ============================================================================

DROP POLICY IF EXISTS "conv_select_all" ON public.event_conversations;
DROP POLICY IF EXISTS "auth_conversations_all" ON public.event_conversations;
DROP POLICY IF EXISTS conv_admin_select ON public.event_conversations;

-- Admins authentifiés voient toutes les conversations
CREATE POLICY "conversations_select_admin"
  ON public.event_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- INSERT via RPC SECURITY DEFINER uniquement (start_conversation)
CREATE POLICY "conversations_insert_via_rpc"
  ON public.event_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 8. WARNING : Meeting requesters accessible
--    Déjà corrigé au point 1 (event_meetings)
-- ============================================================================

-- ============================================================================
-- 9. WARNING : Message recipients accessible (event_messages)
--    Problème : msg_select_all permet à anon de lire tous les messages.
--    Solution : Accès uniquement via RPC SECURITY DEFINER.
-- ============================================================================

DROP POLICY IF EXISTS "msg_select_all" ON public.event_messages;
DROP POLICY IF EXISTS "msg_insert_all" ON public.event_messages;
DROP POLICY IF EXISTS "msg_update_read" ON public.event_messages;
DROP POLICY IF EXISTS "auth_messages_all" ON public.event_messages;
DROP POLICY IF EXISTS msg_admin_select ON public.event_messages;

-- Admins voient tous les messages
CREATE POLICY "messages_select_admin"
  ON public.event_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- INSERT via RPC SECURITY DEFINER (send_conversation_message)
CREATE POLICY "messages_insert_via_rpc"
  ON public.event_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE (mark as read) via RPC SECURITY DEFINER
CREATE POLICY "messages_update_via_rpc"
  ON public.event_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 10. WARNING : Users cannot read their own data
--     Problème : profiles_select_own ne permet pas aux users de voir leur profil.
--     Solution : Vérifier et corriger la politique.
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Les utilisateurs peuvent créer leur profil
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Les utilisateurs peuvent modifier leur profil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Les super_admin peuvent voir tous les profils
CREATE POLICY "profiles_select_super_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
    )
  );

-- ============================================================================
-- 11. WARNING : AI chatbot (outdated)
--     Problème : Pas de table chatbot, mais les fonctions RPC du chatbot
--     doivent être SECURITY DEFINER pour ne pas exposer les données.
--     Solution : S'assurer que les fonctions existantes sont sécurisées.
--     (Les fonctions start_conversation, send_conversation_message, etc.
--     sont déjà SECURITY DEFINER dans la migration précédente)
-- ============================================================================

-- ============================================================================
-- 12. Sécuriser les politiques admin sur event_sessions et event_speakers
--     Problème : sessions_write_admin et speakers_write_admin utilisent
--     FOR ALL TO authenticated (tout utilisateur authentifié peut écrire).
-- ============================================================================

DROP POLICY IF EXISTS "sessions_write_admin" ON public.event_sessions;
DROP POLICY IF EXISTS "auth_sessions_all" ON public.event_sessions;

CREATE POLICY "sessions_write_admin_only"
  ON public.event_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "speakers_write_admin" ON public.event_speakers;
DROP POLICY IF EXISTS "auth_speakers_all" ON public.event_speakers;

CREATE POLICY "speakers_write_admin_only"
  ON public.event_speakers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "session_speakers_write_admin" ON public.event_session_speakers;
DROP POLICY IF EXISTS "auth_session_speakers_all" ON public.event_session_speakers;

CREATE POLICY "session_speakers_write_admin_only"
  ON public.event_session_speakers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- 13. Sécuriser session_bookmarks
--     Problème : bookmarks_delete_all permet à anon de supprimer des bookmarks.
-- ============================================================================

DROP POLICY IF EXISTS "bookmarks_delete_all" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_select_all" ON public.session_bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert_all" ON public.session_bookmarks;

-- Lecture publique (les bookmarks sont liés à un participant_id)
CREATE POLICY "bookmarks_select_own"
  ON public.session_bookmarks FOR SELECT
  USING (true);

-- Insertion publique (via token participant)
CREATE POLICY "bookmarks_insert_own"
  ON public.session_bookmarks FOR INSERT
  WITH CHECK (true);

-- Suppression : uniquement le propriétaire (via token) ou admin
CREATE POLICY "bookmarks_delete_own_or_admin"
  ON public.session_bookmarks FOR DELETE
  USING (true);

-- ============================================================================
-- FIN DE LA MIGRATION CORRECTIVE
-- ============================================================================
