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
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert(
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

    // Envoi de l'email de confirmation via le Hub ANSUT (channel Email).
    // Best-effort : si le Hub n'est pas configuré, l'inscription reste valide.
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
            subject: "Bienvenue sur la newsletter SUTEL 2026",
            content,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.warn("Hub newsletter email failed", res.status, body);
        }
      } else {
        console.warn("ANSUT Hub non configuré — email de confirmation ignoré");
      }
    } catch (err) {
      console.warn("Hub newsletter email exception", err);
    }

    return { ok: true as const };
  });
