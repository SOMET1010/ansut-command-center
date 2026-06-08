/**
 * Integration tests for RLS on `profiles` and `event_registrations`.
 *
 * Strategy
 * --------
 *  • Spin up real Supabase auth users via the admin API (service role).
 *  • Sign each one in to obtain a real JWT and build a per-user PostgREST
 *    client. The Data API enforces RLS exactly like in production.
 *  • Seed two orgs / two events / three registrations.
 *  • Run SELECT / UPDATE / DELETE assertions per role.
 *  • Tear everything down — even on failure.
 *
 * The suite auto-skips when SUPABASE_SERVICE_ROLE_KEY is not exposed
 * (it never ships in the browser bundle), so it is safe to keep in CI.
 *
 * Run locally: `npx vitest run src/__tests__/integration/rls.test.ts`
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const enabled = Boolean(URL && ANON && SERVICE);

const d = enabled ? describe : describe.skip;

const TAG = "__rlstest";
const PWD = "TestPassword!2026";
const newId = () => crypto.randomUUID();

interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}
interface Ctx {
  admin: SupabaseClient;
  orgA: string;
  orgB: string;
  evA: string;
  evB: string;
  regA1: string;
  regB1: string;
  regA2: string;
  superAdmin: TestUser;
  adminA: TestUser;
  adminB: TestUser;
  staffA: TestUser;
  plain: TestUser;
  attendee: TestUser;
}

async function makeUser(admin: SupabaseClient, label: string): Promise<TestUser> {
  const email = `${TAG}_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PWD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser(${label}): ${error?.message}`);
  const client = createClient(URL!, ANON!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signErr } = await client.auth.signInWithPassword({ email, password: PWD });
  if (signErr) throw new Error(`signIn(${label}): ${signErr.message}`);
  return { id: data.user.id, email, client };
}

async function cleanup(ctx: Partial<Ctx>) {
  const a = ctx.admin;
  if (!a) return;
  // Use the admin (service-role) client — RLS is bypassed.
  if (ctx.regA1 || ctx.regB1 || ctx.regA2) {
    await a
      .from("event_registrations")
      .delete()
      .in("id", [ctx.regA1, ctx.regB1, ctx.regA2].filter(Boolean) as string[]);
  }
  if (ctx.evA || ctx.evB) {
    await a
      .from("events")
      .delete()
      .in("id", [ctx.evA, ctx.evB].filter(Boolean) as string[]);
  }
  const userIds = [
    ctx.superAdmin?.id,
    ctx.adminA?.id,
    ctx.adminB?.id,
    ctx.staffA?.id,
    ctx.plain?.id,
    ctx.attendee?.id,
  ].filter(Boolean) as string[];
  if (userIds.length) {
    await a.from("user_roles").delete().in("user_id", userIds);
    await a.from("profiles").delete().in("id", userIds);
    for (const id of userIds) await a.auth.admin.deleteUser(id).catch(() => {});
  }
  if (ctx.orgA || ctx.orgB) {
    await a
      .from("organizations")
      .delete()
      .in("id", [ctx.orgA, ctx.orgB].filter(Boolean) as string[]);
  }
}

d("RLS integration: profiles & event_registrations", () => {
  let ctx: Ctx;

  beforeAll(async () => {
    const admin = createClient(URL!, SERVICE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // create 6 users
    const [superAdmin, adminA, adminB, staffA, plain, attendee] = await Promise.all([
      makeUser(admin, "super"),
      makeUser(admin, "adminA"),
      makeUser(admin, "adminB"),
      makeUser(admin, "staffA"),
      makeUser(admin, "plain"),
      makeUser(admin, "attendee"),
    ]);

    // 2 orgs
    const orgA = newId(),
      orgB = newId();
    const orgInsert = await admin.from("organizations").insert([
      { id: orgA, name: `${TAG}_org_a`, slug: `${TAG}-org-a-${Date.now()}` },
      { id: orgB, name: `${TAG}_org_b`, slug: `${TAG}-org-b-${Date.now()}` },
    ]);
    if (orgInsert.error) throw orgInsert.error;

    // attach profiles to orgs (handle_new_user trigger created the profile rows already)
    await admin.from("profiles").update({ organization_id: orgA }).eq("id", adminA.id);
    await admin.from("profiles").update({ organization_id: orgB }).eq("id", adminB.id);
    await admin.from("profiles").update({ organization_id: orgA }).eq("id", staffA.id);

    // role grants
    const roleInsert = await admin.from("user_roles").insert([
      { user_id: superAdmin.id, role: "super_admin" },
      { user_id: adminA.id, role: "org_admin", organization_id: orgA },
      { user_id: adminB.id, role: "org_admin", organization_id: orgB },
      { user_id: staffA.id, role: "staff", organization_id: orgA },
    ]);
    if (roleInsert.error) throw roleInsert.error;

    // 2 events
    const evA = newId(),
      evB = newId();
    const evInsert = await admin.from("events").insert([
      {
        id: evA,
        organization_id: orgA,
        name: `${TAG}_evt_a`,
        slug: `${TAG}-evt-a-${Date.now()}`,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
        status: "published",
      },
      {
        id: evB,
        organization_id: orgB,
        name: `${TAG}_evt_b`,
        slug: `${TAG}-evt-b-${Date.now()}`,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
        status: "published",
      },
    ]);
    if (evInsert.error) throw evInsert.error;

    // 3 registrations
    const regA1 = newId(),
      regB1 = newId(),
      regA2 = newId();
    const regInsert = await admin.from("event_registrations").insert([
      {
        id: regA1,
        event_id: evA,
        full_name: "Anon A",
        email: `${TAG}_anon_a@test.local`,
        status: "confirmed",
      },
      {
        id: regB1,
        event_id: evB,
        full_name: "Anon B",
        email: `${TAG}_anon_b@test.local`,
        status: "confirmed",
      },
      {
        id: regA2,
        event_id: evA,
        full_name: "Attendee",
        email: attendee.email,
        status: "confirmed",
        user_id: attendee.id,
      },
    ]);
    if (regInsert.error) throw regInsert.error;

    ctx = {
      admin,
      orgA,
      orgB,
      evA,
      evB,
      regA1,
      regB1,
      regA2,
      superAdmin,
      adminA,
      adminB,
      staffA,
      plain,
      attendee,
    };
  }, 60_000);

  afterAll(async () => {
    await cleanup(ctx ?? {});
  }, 30_000);

  // ============ profiles SELECT ============
  describe("profiles SELECT", () => {
    it("super_admin sees the 6 test profiles", async () => {
      const { data, error } = await ctx.superAdmin.client
        .from("profiles")
        .select("id")
        .like("email", `${TAG}%`);
      expect(error).toBeNull();
      expect(data!.length).toBe(6);
    });

    it("org_admin A sees self + staff of org A (and not org B admin)", async () => {
      const { data } = await ctx.adminA.client
        .from("profiles")
        .select("id")
        .like("email", `${TAG}%`);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toContain(ctx.adminA.id);
      expect(ids).toContain(ctx.staffA.id);
      expect(ids).not.toContain(ctx.adminB.id);
      expect(ids).not.toContain(ctx.plain.id);
    });

    it("plain user sees only their own profile", async () => {
      const { data } = await ctx.plain.client
        .from("profiles")
        .select("id")
        .like("email", `${TAG}%`);
      expect(data).toEqual([{ id: ctx.plain.id }]);
    });
  });

  // ============ profiles UPDATE ============
  describe("profiles UPDATE", () => {
    it("plain user can change own full_name", async () => {
      const { error } = await ctx.plain.client
        .from("profiles")
        .update({ full_name: "New Name" })
        .eq("id", ctx.plain.id);
      expect(error).toBeNull();
    });

    it("plain user CANNOT self-assign to an organization", async () => {
      await ctx.plain.client
        .from("profiles")
        .update({ organization_id: ctx.orgA })
        .eq("id", ctx.plain.id);
      // Either errors or silently no-ops; either way the value must remain NULL.
      const { data } = await ctx.admin
        .from("profiles")
        .select("organization_id")
        .eq("id", ctx.plain.id)
        .single();
      expect(data?.organization_id).toBeNull();
    });

    it("plain user CANNOT mutate another user's profile", async () => {
      await ctx.plain.client.from("profiles").update({ full_name: "Hack" }).eq("id", ctx.adminA.id);
      const { data } = await ctx.admin
        .from("profiles")
        .select("full_name")
        .eq("id", ctx.adminA.id)
        .single();
      expect(data?.full_name).not.toBe("Hack");
    });
  });

  // ============ event_registrations SELECT ============
  describe("event_registrations SELECT", () => {
    const all = (c: SupabaseClient) =>
      c.from("event_registrations").select("id").like("email", `${TAG}%`);

    it("super_admin sees all 3", async () => {
      const { data } = await all(ctx.superAdmin.client);
      expect(data!.length).toBe(3);
    });
    it("org_admin A scoped to org A (2 rows, no org B)", async () => {
      const { data } = await all(ctx.adminA.client);
      const ids = (data ?? []).map((r) => r.id);
      expect(ids).toContain(ctx.regA1);
      expect(ids).toContain(ctx.regA2);
      expect(ids).not.toContain(ctx.regB1);
    });
    it("org_admin B scoped to org B (1 row)", async () => {
      const { data } = await all(ctx.adminB.client);
      expect((data ?? []).map((r) => r.id)).toEqual([ctx.regB1]);
    });
    it("staff A scoped to org A (2 rows)", async () => {
      const { data } = await all(ctx.staffA.client);
      expect(data!.length).toBe(2);
    });
    it("attendee sees only their own registration", async () => {
      const { data } = await all(ctx.attendee.client);
      expect((data ?? []).map((r) => r.id)).toEqual([ctx.regA2]);
    });
    it("plain user sees nothing", async () => {
      const { data } = await all(ctx.plain.client);
      expect(data).toEqual([]);
    });
  });

  // ============ event_registrations UPDATE ============
  describe("event_registrations UPDATE", () => {
    it("staff A can check-in a registration in own org", async () => {
      const { error } = await ctx.staffA.client
        .from("event_registrations")
        .update({
          status: "checked_in",
          checked_in_at: new Date().toISOString(),
          checked_in_by: ctx.staffA.id,
        })
        .eq("id", ctx.regA1);
      expect(error).toBeNull();
    });

    it("staff CANNOT mutate email (immutable column)", async () => {
      await ctx.staffA.client
        .from("event_registrations")
        .update({ email: "hijack@x.io" })
        .eq("id", ctx.regA1);
      const { data } = await ctx.admin
        .from("event_registrations")
        .select("email")
        .eq("id", ctx.regA1)
        .single();
      expect(data?.email).toBe(`${TAG}_anon_a@test.local`);
    });

    it("staff CANNOT mutate event_id (immutable column)", async () => {
      await ctx.staffA.client
        .from("event_registrations")
        .update({ event_id: ctx.evB })
        .eq("id", ctx.regA1);
      const { data } = await ctx.admin
        .from("event_registrations")
        .select("event_id")
        .eq("id", ctx.regA1)
        .single();
      expect(data?.event_id).toBe(ctx.evA);
    });

    it("staff CANNOT rotate qr_token", async () => {
      const before = (
        await ctx.admin.from("event_registrations").select("qr_token").eq("id", ctx.regA1).single()
      ).data?.qr_token;
      await ctx.staffA.client
        .from("event_registrations")
        .update({ qr_token: crypto.randomUUID() })
        .eq("id", ctx.regA1);
      const after = (
        await ctx.admin.from("event_registrations").select("qr_token").eq("id", ctx.regA1).single()
      ).data?.qr_token;
      expect(after).toBe(before);
    });

    it("org_admin A CANNOT update a registration of org B", async () => {
      await ctx.adminA.client
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", ctx.regB1);
      const { data } = await ctx.admin
        .from("event_registrations")
        .select("status")
        .eq("id", ctx.regB1)
        .single();
      expect(data?.status).toBe("confirmed");
    });

    it("plain user CANNOT update any registration", async () => {
      await ctx.plain.client
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", ctx.regA1);
      const { data } = await ctx.admin
        .from("event_registrations")
        .select("status")
        .eq("id", ctx.regA1)
        .single();
      expect(data?.status).not.toBe("cancelled");
    });

    it("attendee owner CANNOT modify their own registration", async () => {
      await ctx.attendee.client
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", ctx.regA2);
      const { data } = await ctx.admin
        .from("event_registrations")
        .select("status")
        .eq("id", ctx.regA2)
        .single();
      expect(data?.status).toBe("confirmed");
    });
  });

  // ============ event_registrations DELETE ============
  describe("event_registrations DELETE", () => {
    it("staff CANNOT delete", async () => {
      await ctx.staffA.client.from("event_registrations").delete().eq("id", ctx.regA1);
      const { data } = await ctx.admin.from("event_registrations").select("id").eq("id", ctx.regA1);
      expect(data?.length).toBe(1);
    });

    it("org_admin A CANNOT delete a registration of org B", async () => {
      await ctx.adminA.client.from("event_registrations").delete().eq("id", ctx.regB1);
      const { data } = await ctx.admin.from("event_registrations").select("id").eq("id", ctx.regB1);
      expect(data?.length).toBe(1);
    });

    it("org_admin A CAN delete a registration of own org", async () => {
      const { error } = await ctx.adminA.client
        .from("event_registrations")
        .delete()
        .eq("id", ctx.regA1);
      expect(error).toBeNull();
      const { data } = await ctx.admin.from("event_registrations").select("id").eq("id", ctx.regA1);
      expect(data?.length).toBe(0);
    });

    it("super_admin CAN delete any registration", async () => {
      const { error } = await ctx.superAdmin.client
        .from("event_registrations")
        .delete()
        .eq("id", ctx.regB1);
      expect(error).toBeNull();
      const { data } = await ctx.admin.from("event_registrations").select("id").eq("id", ctx.regB1);
      expect(data?.length).toBe(0);
    });

    it("plain user CANNOT delete", async () => {
      await ctx.plain.client.from("event_registrations").delete().eq("id", ctx.regA2);
      const { data } = await ctx.admin.from("event_registrations").select("id").eq("id", ctx.regA2);
      expect(data?.length).toBe(1);
    });
  });
});

if (!enabled) {
  // surface a clear note in CI logs

  console.warn(
    "[rls.test] SKIPPED — missing env (need SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY).",
  );
}
