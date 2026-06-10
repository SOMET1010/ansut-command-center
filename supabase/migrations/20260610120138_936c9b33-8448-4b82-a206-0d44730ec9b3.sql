
DROP POLICY IF EXISTS conversations_select_admin ON public.event_conversations;
CREATE POLICY conversations_select_admin ON public.event_conversations
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      public.has_role(auth.uid(), 'org_admin'::app_role)
      AND public.event_org(event_id) = public.current_user_org()
    )
  );

DROP POLICY IF EXISTS messages_select_admin ON public.event_messages;
CREATE POLICY messages_select_admin ON public.event_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      public.has_role(auth.uid(), 'org_admin'::app_role)
      AND public.event_org(
        (SELECT c.event_id FROM public.event_conversations c WHERE c.id = conversation_id)
      ) = public.current_user_org()
    )
  );
