import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide").max(255),
  source: z.string().max(60).optional(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubscribeSchema.parse(input))
  .handler(async ({ data }) => {
    // Lecture préalable : permet de savoir si on doit (ré)envoyer un email de
    // confirmation ou si l'adresse a déjà reçu un envoi récent (anti email-bomb).
    const { data: existing } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("created_at, updated_at, confirmed_at")
      .eq("email", data.email)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("newsletter_subscribers").upsert(
      {
        email: data.email,
        source: data.source ?? "landing",
        unsubscribed_at: null,
      },
      { onConflict: "email" },
    );

    if (error) {
      console.error("newsletter subscribe error", error);
      return { ok: false as const, error: "Inscription impossible, réessayez." };
    }

    // Anti email-bomb : si l'adresse existe déjà et qu'un email a été
    // envoyé/maj dans les 10 dernières minutes, on n'en envoie pas un nouveau.
    const COOLDOWN_MS = 10 * 60 * 1000;
    const last = existing?.updated_at ?? existing?.created_at;
    const recentlyTouched = last ? Date.now() - new Date(last).getTime() < COOLDOWN_MS : false;
    if (existing && recentlyTouched) {
      return { ok: true as const, emailStatus: "skipped" as const, emailError: "cooldown" };
    }

    let emailStatus: "sent" | "skipped" | "failed" = "skipped";
    let emailError: string | undefined;

    try {
      const baseUrl = process.env.ANSUT_HUB_URL;
      const username = process.env.ANSUT_HUB_USERNAME;
      const password = process.env.ANSUT_HUB_PASSWORD;

      if (baseUrl && username && password) {
        const url = `${baseUrl.replace(/\/+$/, "")}/api/message/send`;
        const content = [
          "Bonjour,",
          "",
          "Merci de votre inscription à la newsletter SUTEL 2026 / ANSUT EVENT.",
          "Vous recevrez bientôt les actualités du salon, le programme et vos accès badge.",
          "",
          "À très vite,",
          "L'équipe ANSUT EVENT",
        ].join("\n");

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            channel: "Email",
            to: data.email,
            cc: null,
            bcc: null,
            subject: "Bienvenue sur la newsletter SUTEL 2026",
            content,
            ishtml: false,
          }),
        });

        if (res.ok) {
          emailStatus = "sent";
        } else {
          const body = await res.text().catch(() => "");
          console.warn("Hub newsletter email failed", res.status, body);
          emailStatus = "failed";
          emailError = `Hub ${res.status}`;
        }
      } else {
        console.warn("ANSUT Hub non configuré — email de confirmation ignoré");
        emailError = "Hub non configuré";
      }
    } catch (err) {
      console.warn("Hub newsletter email exception", err);
      emailStatus = "failed";
      emailError = err instanceof Error ? err.message : "Erreur réseau Hub";
    }

    return { ok: true as const, emailStatus, emailError };
  });
