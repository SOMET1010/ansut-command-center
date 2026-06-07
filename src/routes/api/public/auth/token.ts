import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

const Schema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(256),
});

export const Route = createFileRoute("/api/public/auth/token")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, password } = Schema.parse(body);
          const url = process.env.SUPABASE_URL!;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({ email, password }),
          });
          const text = await res.text();
          return new Response(text, {
            status: res.status,
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
