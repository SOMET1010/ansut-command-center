import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Envoi de notifications via le Hub ANSUT.
 *
 * Le Hub ANSUT est le point d'entrée unique pour tous les canaux :
 *  - Email
 *  - WhatsApp (templates Business)
 *  - SMS
 *  - Telegram
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
      .select("full_name, email, phone, telegram_username, event_id")
      .eq("qr_token", data.qr_token)
      .maybeSingle();
    if (regErr || !reg) {
      return { ok: false as const, error: "Inscription introuvable" };
    }

    // Déterminer le destinataire selon le canal
    let recipient: string | null = null;
    switch (data.channel) {
      case "Email":
        recipient = reg.email;
        break;
      case "WhatsApp":
      case "SMS":
        recipient = reg.phone;
        break;
      case "Telegram":
        recipient = reg.telegram_username;
        break;
    }
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
  const payload: Record<string, unknown> = {
    username,
    password,
    channel: opts.channel,
    to: opts.to.replace(/\s+/g, ""),
    content: opts.content,
  };

  // Paramètres spécifiques par canal
  switch (opts.channel) {
    case "Email":
      payload.subject = opts.subject ?? "ANSUT EVENT — Notification";
      payload.ishtml = false;
      break;

    case "WhatsApp":
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
      // Le Hub ANSUT gère le SMS directement via le champ channel
      // Pas de paramètres supplémentaires nécessaires
      break;

    case "Telegram":
      // Le Hub ANSUT gère Telegram directement via le champ channel
      // Le champ "to" contient le chat_id ou username Telegram
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
 */
export async function sendMultiChannel(opts: {
  email: string | null;
  phone: string | null;
  telegramUsername: string | null;
  content: string;
  subject?: string;
  eventName: string;
  params: string[];
  channels: NotificationChannel[];
}): Promise<{ results: Record<string, { ok: boolean; error?: string }> }> {
  const results: Record<string, { ok: boolean; error?: string }> = {};

  for (const channel of opts.channels) {
    let to: string | null = null;
    switch (channel) {
      case "Email":
        to = opts.email;
        break;
      case "WhatsApp":
      case "SMS":
        to = opts.phone;
        break;
      case "Telegram":
        to = opts.telegramUsername;
        break;
    }

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
