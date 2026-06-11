/**
 * Layout Super Admin — /admin/*
 * Vérifie le rôle super_admin. Redirect vers /dashboard si non autorisé.
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isLovablePreview } from "@/lib/auth-preview";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = isLovablePreview()
      ? (await supabase.auth.getSession()).data.session?.user
      : (await supabase.auth.getUser()).data.user;

    if (!user) throw redirect({ to: "/login" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles?.some((r) => r.role === "super_admin")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}