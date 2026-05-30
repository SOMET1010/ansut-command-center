import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AgendaItem = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  slug: string;
};

export type LandingData = {
  featuredEvent: {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    starts_at: string;
    ends_at: string;
  } | null;
  stats: {
    participants: number;
    badges: number;
    conferences: number;
    partners: number;
    attendanceRate: number;
  };
  agenda: AgendaItem[];
};

export const getLandingData = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingData> => {
    const [
      { data: featured },
      { count: participants },
      { count: badges },
      { count: conferences },
      { count: partners },
      { count: checkedIn },
      { data: upcoming },
    ] = await Promise.all([
      supabaseAdmin
        .from("events")
        .select("id, name, slug, location, starts_at, ends_at")
        .eq("status", "published")
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("event_registrations")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed"),
      supabaseAdmin
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabaseAdmin
        .from("organizations")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .not("checked_in_at", "is", null),
      supabaseAdmin
        .from("events")
        .select("id, name, slug, location, starts_at, ends_at")
        .eq("status", "published")
        .gte("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(4),
    ]);

    const total = participants ?? 0;
    const present = checkedIn ?? 0;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      featuredEvent: featured ?? null,
      stats: {
        participants: total,
        badges: badges ?? 0,
        conferences: conferences ?? 0,
        partners: partners ?? 0,
        attendanceRate: rate,
      },
      agenda: (upcoming ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        location: e.location,
        starts_at: e.starts_at,
        ends_at: e.ends_at,
      })),
    };
  },
);
