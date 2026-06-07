-- =====================================================
-- AUDIT_TRAIL : journal central des notifications
-- =====================================================
CREATE TABLE public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_trail TO authenticated;
GRANT ALL ON public.audit_trail TO service_role;

ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_trail_select_admin ON public.audit_trail
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND organization_id IS NOT NULL
      AND organization_id = public.current_user_org()
    )
  );

CREATE INDEX idx_audit_trail_created_at ON public.audit_trail (created_at DESC);
CREATE INDEX idx_audit_trail_action ON public.audit_trail (action, created_at DESC);
CREATE INDEX idx_audit_trail_table ON public.audit_trail (table_name, created_at DESC);

-- =====================================================
-- NOTIFICATION_OUTBOX : file d'envoi avec idempotence
-- =====================================================
CREATE TABLE public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  purpose text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','email','whatsapp','telegram')),
  recipient text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','skipped')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  registration_id uuid REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_outbox TO authenticated;
GRANT ALL ON public.notification_outbox TO service_role;

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY outbox_select_admin ON public.notification_outbox
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'org_admin')
      AND event_id IS NOT NULL
      AND public.event_org(event_id) = public.current_user_org()
    )
  );

CREATE INDEX idx_outbox_status_scheduled
  ON public.notification_outbox (status, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_outbox_registration ON public.notification_outbox (registration_id);

CREATE TRIGGER set_outbox_updated_at
  BEFORE UPDATE ON public.notification_outbox
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();