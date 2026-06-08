import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyRoleResponse = {
  authenticated: true;
  userId: string;
  email: string | null;
  roles: string[];
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isStaff: boolean;
};

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyRoleResponse> => {
    const { supabase, userId, claims } = context;

    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }

    const roles = (data ?? []).map((r) => r.role as string);

    return {
      authenticated: true,
      userId,
      email: (claims.email as string | undefined) ?? null,
      roles,
      isSuperAdmin: roles.includes("super_admin"),
      isOrgAdmin: roles.includes("org_admin"),
      isStaff: roles.includes("staff"),
    };
  });
