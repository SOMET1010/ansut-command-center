import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Envoi de la confirmation d'inscription via le Hub ANSUT.
 *
 * Sécurité :
 *  - L'appelant ne peut PAS choisir le destinataire ni le contenu.
 *  - Il fournit uniquement le `qr_token` retourné par `register_for_event`.
 *  - Le serveur récupère le numéro/email/nom depuis la base via le service role,
 *    puis construit le message à partir des données de l'événement.
 *  - On limite à 3 envois par inscription (anti-flood) et on n'expose pas la
 *    réponse brute du Hub aux clients.
 */
const ConfirmationSchema = z.object({
  qr_token: z.string().uuid(),
  channel: z.enum(["WhatsApp", "Email"]).default("WhatsApp"),
});

const MAX_SENDS_PER_REGISTRATION = 3;
const sentCounts = new Map<string, number>();

export const sendRegistrationConfirmation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConfirmationSchema.parse(input))
  .handler(async ({ data }) => {
    const baseUrl = process.env.ANSUT_HUB_URL;
    const username = process.env.ANSUT_HUB_USERNAME;
    const password = process.env.ANSUT_HUB_PASSWORD;
    if (!baseUrl || !username || !password) {
      console.error("ANSUT Hub credentials missing");
      return { ok: false as const, error: "Hub non configuré" };
    }

    // Anti-flood : empêche un attaquant de boucler sur un même qr_token.
    const key = `${data.qr_token}:${data.channel}`;
    const count = sentCounts.get(key) ?? 0;
    if (count >= MAX_SENDS_PER_REGISTRATION) {
      return { ok: false as const, error: "Trop de tentatives" };
    }
    sentCounts.set(key, count + 1);

    // Lookup registration server-side — RLS bypass intentional (anonymous flow).
    const { data: reg, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .select("full_name, email, phone, event_id")
      .eq("qr_token", data.qr_token)
      .maybeSingle();
    if (regErr || !reg) {
      return { ok: false as const, error: "Inscription introuvable" };
    }
    const recipient = data.channel === "Email" ? reg.email : reg.phone;
    if (!recipient) {
      return { ok: false as const, error: "Destinataire manquant" };
    }

    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("name, starts_at, location")
      .eq("id", reg.event_id)
      .maybeSingle();
    if (!ev) {
      return { ok: false as const, error: "Événement introuvable" };
    }

    const dateStr = new Date(ev.starts_at).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const location = (ev.location ?? "en ligne").trim() || "en ligne";
    const params = [reg.full_name.trim(), ev.name.trim(), dateStr, location];
    const fallbackText = `Bonjour ${params[0]}, votre inscription à "${params[1]}" est confirmée.\nDate : ${params[2]}\nLieu : ${params[3]}\n\nMerci — ANSUT EVENT.`;

    const url = `${baseUrl.replace(/\/+$/, "")}/api/message/send`;
    const payload: Record<string, unknown> = {
      username,
      password,
      channel: data.channel,
      to: recipient.replace(/\s+/g, ""),
      content: fallbackText,
    };
    if (data.channel === "Email") {
      payload.subject = `Confirmation — ${ev.name}`;
      payload.ishtml = false;
    } else {
      payload.whatsAppTemplate = {
        name: "ansut_event_confirmation",
        languageCode: "fr",
        parameters: params,
        components: [
          {
            type: "body",
            parameters: params.map((text) => ({ type: "text", text })),
          },
        ],
      };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { ok: true as const };
      const body = await res.text().catch(() => "");
      console.error("Hub send failed", res.status, body);
      return { ok: false as const, error: `Hub ${res.status}` };
    } catch (err) {
      console.error("Hub send exception", err);
      return { ok: false as const, error: "Erreur réseau Hub" };
    }
  });

/** Helper conservé pour la compat — uniquement utilisé côté serveur désormais. */
export function buildRegistrationTemplateParams(opts: {
  fullName: string;
  eventName: string;
  startsAt: string | Date;
  location?: string | null;
}): string[] {
  const date = new Date(opts.startsAt).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return [
    opts.fullName.trim(),
    opts.eventName.trim(),
    date,
    (opts.location ?? "en ligne").trim() || "en ligne",
  ];
}
