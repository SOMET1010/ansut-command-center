import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { corsHeaders } from "@/lib/api/cors";

const QuerySchema = z.object({ user_id: z.string().uuid() });

export const Route = createFileRoute("/api/public/auth/roles")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: corsHeaders(request, "GET, OPTIONS") }),
      GET: async ({ request }) => {
        const cors = corsHeaders(request, "GET, OPTIONS");
        try {
          const authHeader = request.headers.get("authorization") ?? "";
          const token = authHeader.replace(/^Bearer\s+/i, "").trim();
          if (!token) {
            return new Response(JSON.stringify({ error: "missing_token" }), {
              status: 401,
              headers: { "Content-Type": "application/json", ...cors },
            });
          }

          const { searchParams } = new URL(request.url);
          const { user_id } = QuerySchema.parse({ user_id: searchParams.get("user_id") });
          const url = process.env.SUPABASE_URL!;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const res = await fetch(
            `${url}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(user_id)}&select=role`,
            {
              headers: {
                apikey: key,
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          );
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: { "Content-Type": "application/json", ...cors },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "invalid_request";
          return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});