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

    // Try to send a confirmation email (best-effort). If the email infra
    // is not yet configured, the call will fail silently and the user is
    // still subscribed.
    try {
      const origin = process.env.SITE_URL ?? "";
      await fetch(`${origin}/lovable/email/transactional/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateName: "newsletter-confirmation",
          recipientEmail: data.email,
          idempotencyKey: `newsletter-${data.email}`,
        }),
      }).catch(() => undefined);
    } catch {
      // no-op: email infra optional
    }

    return { ok: true as const };
  });
