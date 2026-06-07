import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Envoi de notifications via le Hub ANSUT.
 *
 * Endpoint unique : {ANSUT_HUB_URL}/api/message/send
 *
 * Canaux supportés (tous utilisent le même endpoint) :
 *  - Email    → to = adresse email
 *  - WhatsApp → to = numéro de téléphone (format international, ex: 22507000000)
 *  - SMS      → to = numéro de téléphone (format international)
 *  - Telegram → to = numéro de téléphone (format international)
 *
 * Sécurité :
 *  - L'appelant ne peut PAS choisir le destinataire ni le contenu.
 *  - Il fournit uniquement le `qr_token` retourné par `register_for_event`.
 *  - Le serveur récupère le numéro/email/nom depuis la base via le service role,
 *    puis construit le message à partir des données de l'événement.
 *  - On limite à 3 envois par inscription par canal (anti-flood).
 */

export type NotificationChannel = "Email" | "WhatsApp" | "SMS" | "Telegram";

const SUPPORTED_CHANNELS: NotificationChannel[] = ["Email", "WhatsApp", "SMS", "Telegram"];

const ConfirmationSchema = z.object({
  qr_token: z.string().uuid(),
  channel: z.enum(["WhatsApp", "Email", "SMS", "Telegram"]).default("WhatsApp"),
});

const MAX_SENDS_PER_REGISTRATION = 3;
const sentCounts = new Map<string, number>();

export const sendRegistrationConfirmation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConfirmationSchema.parse(input))
  .handler(async ({ data }) => {
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

    // Déterminer le destinataire selon le canal
    // Email → email | WhatsApp, SMS, Telegram → numéro de téléphone
    const recipient = data.channel === "Email" ? reg.email : reg.phone;
    if (!recipient) {
      return { ok: false as const, error: `Destinataire manquant pour le canal ${data.channel}` };
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
    const messageText = `Bonjour ${params[0]}, votre inscription à "${params[1]}" est confirmée.\nDate : ${params[2]}\nLieu : ${params[3]}\n\nMerci — ANSUT EVENT.`;

    return sendViaHub({
      channel: data.channel,
      to: recipient,
      content: messageText,
      subject: `Confirmation — ${ev.name}`,
      eventName: ev.name,
      params,
    });
  });

// ─── Hub ANSUT — Point d'entrée unique pour tous les canaux ────────────────────

interface HubSendOptions {
  channel: NotificationChannel;
  to: string;
  content: string;
  subject?: string;
  eventName?: string;
  params?: string[];
}

export async function sendViaHub(opts: HubSendOptions): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.ANSUT_HUB_URL;
  const username = process.env.ANSUT_HUB_USERNAME;
  const password = process.env.ANSUT_HUB_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.error("ANSUT Hub credentials missing");
    return { ok: false, error: "Hub ANSUT non configuré" };
  }

  if (!opts.to) {
    return { ok: false, error: "Destinataire manquant" };
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/api/message/send`;

  // Normaliser le destinataire : retirer espaces, +, points, tirets pour les canaux téléphone
  const to = opts.channel === "Email"
    ? opts.to.trim()
    : opts.to.replace(/[\s.+()-]/g, "");

  const payload: Record<string, unknown> = {
    username,
    password,
    channel: opts.channel,
    to,
    content: opts.content,
  };

  // Paramètres spécifiques par canal selon la doc Hub ANSUT
  switch (opts.channel) {
    case "Email":
      payload.subject = opts.subject ?? "ANSUT EVENT — Notification";
      payload.ishtml = false;
      break;

    case "WhatsApp":
      // Template WhatsApp si des paramètres sont fournis
      if (opts.params && opts.params.length > 0) {
        payload.whatsAppTemplate = {
          name: "ansut_event_confirmation",
          languageCode: "fr",
          parameters: opts.params,
          components: [
            {
              type: "body",
              parameters: opts.params.map((text) => ({ type: "text", text })),
            },
          ],
        };
      }
      break;

    case "SMS":
      // Pas de paramètres supplémentaires — le Hub gère directement
      break;

    case "Telegram":
      // Pas de paramètres supplémentaires — le Hub route via le numéro de téléphone
      break;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    const body = await res.text().catch(() => "");
    console.error(`Hub send failed [${opts.channel}]`, res.status, body);
    return { ok: false, error: `Hub ${opts.channel} — erreur ${res.status}` };
  } catch (err) {
    console.error(`Hub send exception [${opts.channel}]`, err);
    return { ok: false, error: `Erreur réseau Hub (${opts.channel})` };
  }
}

// ─── Utilitaire multi-canal ────────────────────────────────────────────────────

/**
 * Envoie un message sur tous les canaux disponibles pour un participant donné.
 * Utilise exclusivement le Hub ANSUT comme point d'entrée.
 *
 * Règle de routage :
 *  - Email → nécessite une adresse email
 *  - WhatsApp, SMS, Telegram → nécessitent un numéro de téléphone
 */
export async function sendMultiChannel(opts: {
  email: string | null;
  phone: string | null;
  content: string;
  subject?: string;
  eventName: string;
  params: string[];
  channels: NotificationChannel[];
}): Promise<{ results: Record<string, { ok: boolean; error?: string }> }> {
  const results: Record<string, { ok: boolean; error?: string }> = {};

  for (const channel of opts.channels) {
    // Email → email, tout le reste → téléphone
    const to = channel === "Email" ? opts.email : opts.phone;

    if (!to) {
      results[channel] = { ok: false, error: "Destinataire manquant" };
      continue;
    }

    results[channel] = await sendViaHub({
      channel,
      to,
      content: opts.content,
      subject: opts.subject,
      eventName: opts.eventName,
      params: opts.params,
    });
  }

  return { results };
}

// ─── Helpers exportés ──────────────────────────────────────────────────────────

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

/** Liste des canaux supportés — utilisé côté UI pour afficher les options. */
export { SUPPORTED_CHANNELS };
