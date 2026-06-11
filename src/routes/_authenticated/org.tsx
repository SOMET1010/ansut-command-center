/**
 * Layout Org Admin — /org/*
 * Guard : org_admin (ou super_admin qui a accès à tout).
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isLovablePreview } from "@/lib/auth-preview";

export const Route = createFileRoute("/org")({
  beforeLoad: async () => {
    const user = isLovablePreview()
      ? (await supabase.auth.getSession()).data.session?.user
      : (await supabase.auth.getUser()).data.user;

    if (!user) throw redirect({ to: "/login" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasOrgAdmin = roles?.some((r) => r.role === "org_admin");
    const hasSuperAdmin = roles?.some((r) => r.role === "super_admin");

    if (!hasOrgAdmin && !hasSuperAdmin) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OrgLayout,
});

function OrgLayout() {
  return <Outlet />;
}