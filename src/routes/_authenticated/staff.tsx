/**
 * Layout Staff — /staff/*
 * Guard : staff (ou supérieur).
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isLovablePreview } from "@/lib/auth-preview";

export const Route = createFileRoute("/_authenticated/staff")({
  beforeLoad: async () => {
    const user = isLovablePreview()
      ? (await supabase.auth.getSession()).data.session?.user
      : (await supabase.auth.getUser()).data.user;

    if (!user) throw redirect({ to: "/login" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleSet = new Set(roles?.map((r) => r.role) ?? []);
    const isStaff = roleSet.has("staff");
    const isAdmin = roleSet.has("super_admin") || roleSet.has("org_admin");

    if (!isStaff && !isAdmin) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: StaffLayout,
});

function StaffLayout() {
  return <Outlet />;
}