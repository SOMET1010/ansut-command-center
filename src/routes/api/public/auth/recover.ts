import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

const Schema = z.object({
  email: z.string().email().max(320),
  redirectTo: z.string().url().max(2048).optional(),
});

export const Route = createFileRoute("/api/public/auth/recover")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, redirectTo } = Schema.parse(body);
          const url = process.env.SUPABASE_URL!;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const qs = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
          const res = await fetch(`${url}/auth/v1/recover${qs}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ email }),
          });
          // Supabase returns 200 even when the email doesn't exist (to prevent enumeration).
          if (!res.ok) {
            const text = await res.text();
            return new Response(text || JSON.stringify({ error: "recover_failed" }), {
              status: res.status,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "invalid_request";
          return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
