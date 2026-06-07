import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendViaHub, type NotifyChannel } from "@/lib/ansut-notify.server";

/**
 * Envoi de la confirmation d'inscription via le Hub ANSUT.
 *
 * Sécurité :
 *  - L'appelant ne fournit qu'un `qr_token` (retourné par `register_for_event`).
 *  - Le serveur récupère destinataire + contenu côté DB (service role) — jamais
 *    fourni par le client.
 *  - Anti-flood : max 3 envois / (qr_token, channel) par instance serveur.
 *  - TOUS les envois passent par `sendViaHub` → audit_trail systématique.
 */
const ConfirmationSchema = z.object({
  qr_token: z.string().uuid(),
  channel: z.enum(["sms", "email", "whatsapp"]).default("email"),
});

const MAX_SENDS_PER_REGISTRATION = 3;
const sentCounts = new Map<string, number>();

export const sendRegistrationConfirmation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConfirmationSchema.parse(input))
  .handler(async ({ data }) => {
    const key = `${data.qr_token}:${data.channel}`;
    const count = sentCounts.get(key) ?? 0;
    if (count >= MAX_SENDS_PER_REGISTRATION) {
      return { ok: false as const, error: "Trop de tentatives" };
    }
    sentCounts.set(key, count + 1);

    // Lookup serveur — RLS bypass intentionnel (flux anonyme post-inscription).
    const { data: reg, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .select("id, full_name, email, phone, event_id")
      .eq("qr_token", data.qr_token)
      .maybeSingle();
    if (regErr || !reg) {
      return { ok: false as const, error: "Inscription introuvable" };
    }
    const recipient = data.channel === "email" ? reg.email : reg.phone;
    if (!recipient) {
      return { ok: false as const, error: "Destinataire manquant" };
    }

    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("name, starts_at, location, organization_id")
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
    const fullName = reg.full_name.trim();
    const text =
      data.channel === "email"
        ? `<p>Bonjour ${fullName},</p>` +
          `<p>Votre inscription à <strong>${ev.name}</strong> est confirmée.</p>` +
          `<ul><li><strong>Date :</strong> ${dateStr}</li>` +
          `<li><strong>Lieu :</strong> ${location}</li></ul>` +
          `<p>À très bientôt — <em>ANSUT EVENT</em>.</p>`
        : `Bonjour ${fullName}, votre inscription à "${ev.name}" est confirmée.\n` +
          `Date : ${dateStr}\nLieu : ${location}\n\nMerci — ANSUT EVENT.`;

    const result = await sendViaHub({
      channel: data.channel as NotifyChannel,
      to: recipient,
      text,
      subject: data.channel === "email" ? `Confirmation — ${ev.name}` : undefined,
      ishtml: data.channel === "email",
      whatsAppTemplate:
        data.channel === "whatsapp"
          ? {
              name: "ansut_event_confirmation",
              languageCode: "fr",
              parameters: [fullName, ev.name, dateStr, location],
            }
          : undefined,
      audit: {
        purpose: "REGISTRATION_CONFIRMED",
        eventId: reg.event_id,
        registrationId: reg.id,
        organizationId: ev.organization_id ?? null,
      },
    });

    if (!result.ok) {
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  });

/**
 * Test manuel d'envoi — réservé aux super_admin / org_admin / staff via le
 * cockpit. Pour vérifier la chaîne complète (Hub joignable, secrets OK,
 * audit_trail alimenté) sans dépendre d'un trigger métier.
 */
const TestNotificationSchema = z.object({
  channel: z.enum(["sms", "email", "whatsapp", "telegram"]),
  to: z.string().min(1).max(320),
  text: z.string().min(1).max(1000),
  subject: z.string().max(200).optional(),
});

export const sendAdminTestNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TestNotificationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Vérif rôle côté serveur (defense-in-depth ; RLS ne couvre pas cette fn).
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = (roles ?? []).some((r) =>
      ["super_admin", "org_admin", "staff"].includes(r.role as string),
    );
    if (!allowed) {
      return { ok: false as const, error: "Accès refusé" };
    }

    const result = await sendViaHub({
      channel: data.channel,
      to: data.to,
      text: data.text,
      subject: data.subject,
      ishtml: data.channel === "email",
      audit: {
        purpose: "ADMIN_TEST",
        userId,
      },
    });

    if (!result.ok) {
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
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
