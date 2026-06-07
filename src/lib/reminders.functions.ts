import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type NotificationChannel, sendMultiChannel } from "./notifications.functions";

/**
 * Envoi de rappels multi-canal aux participants inscrits à un événement.
 *
 * Tous les canaux transitent par le Hub ANSUT :
 *  - Email    → to = adresse email
 *  - WhatsApp → to = numéro de téléphone
 *  - SMS      → to = numéro de téléphone
 *  - Telegram → to = numéro de téléphone
 *
 * L'organisateur choisit les canaux à utiliser depuis l'interface.
 *
 * Sécurité :
 *  - L'appelant fournit uniquement l'event_id et les canaux souhaités.
 *  - Le serveur récupère les données depuis la base via le service role.
 *  - Anti-flood : un seul rappel par événement par canal toutes les 4 heures.
 */

const ReminderSchema = z.object({
  event_id: z.string().uuid(),
  channels: z
    .array(z.enum(["Email", "WhatsApp", "SMS", "Telegram"]))
    .min(1, "Sélectionnez au moins un canal")
    .default(["Email"]),
});

// Anti-flood : stocke le dernier envoi par event_id + canal
const lastReminderSent = new Map<string, number>();
const MIN_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 heures

export const sendEventReminder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReminderSchema.parse(input))
  .handler(async ({ data }) => {
    // Anti-flood par canal
    const blockedChannels: string[] = [];
    for (const ch of data.channels) {
      const key = `${data.event_id}:${ch}`;
      const lastSent = lastReminderSent.get(key) ?? 0;
      if (Date.now() - lastSent < MIN_INTERVAL_MS) {
        const remainingMin = Math.ceil((MIN_INTERVAL_MS - (Date.now() - lastSent)) / 60_000);
        blockedChannels.push(`${ch} (réessayez dans ${remainingMin} min)`);
      }
    }

    // Filtrer les canaux disponibles (non bloqués par l'anti-flood)
    const availableChannels = data.channels.filter(
      (ch) => !blockedChannels.some((b) => b.startsWith(ch)),
    ) as NotificationChannel[];

    if (availableChannels.length === 0) {
      return {
        ok: false as const,
        error: `Rappels déjà envoyés récemment : ${blockedChannels.join(", ")}`,
        sent: 0,
        details: {},
      };
    }

    // Récupérer l'événement
    const { data: event, error: evErr } = await supabaseAdmin
      .from("events")
      .select("id, name, starts_at, ends_at, location")
      .eq("id", data.event_id)
      .single();

    if (evErr || !event) {
      return { ok: false as const, error: "Événement introuvable", sent: 0, details: {} };
    }

    // Récupérer les inscrits confirmés/pending
    const { data: registrations, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .select("id, full_name, email, phone, status")
      .eq("event_id", data.event_id)
      .in("status", ["confirmed", "pending"]);

    if (regErr) {
      return { ok: false as const, error: regErr.message, sent: 0, details: {} };
    }

    if (!registrations || registrations.length === 0) {
      return { ok: false as const, error: "Aucun inscrit à notifier", sent: 0, details: {} };
    }

    // Préparer le contenu du rappel
    const dateStr = new Date(event.starts_at).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const location = (event.location ?? "en ligne").trim() || "en ligne";

    // Compteurs par canal
    const channelStats: Record<string, { sent: number; failed: number }> = {};
    for (const ch of availableChannels) {
      channelStats[ch] = { sent: 0, failed: 0 };
    }

    // Envoyer les rappels à chaque inscrit sur les canaux disponibles
    for (const reg of registrations) {
      const personalizedText = [
        `Bonjour ${reg.full_name.trim()},`,
        ``,
        `Rappel : l'événement "${event.name}" approche !`,
        ``,
        `📅 Date : ${dateStr}`,
        `📍 Lieu : ${location}`,
        ``,
        `N'oubliez pas votre badge QR pour le contrôle d'accès.`,
        ``,
        `À bientôt !`,
        `L'équipe ANSUT EVENT`,
      ].join("\n");

      const params = [reg.full_name.trim(), event.name.trim(), dateStr, location];

      // Déterminer les canaux applicables pour ce participant :
      // Email → nécessite un email
      // WhatsApp, SMS, Telegram → nécessitent un numéro de téléphone
      const regChannels: NotificationChannel[] = [];
      for (const ch of availableChannels) {
        if (ch === "Email" && reg.email) regChannels.push("Email");
        if ((ch === "WhatsApp" || ch === "SMS" || ch === "Telegram") && reg.phone) {
          regChannels.push(ch);
        }
      }

      if (regChannels.length === 0) continue;

      const { results } = await sendMultiChannel({
        email: reg.email ?? null,
        phone: reg.phone ?? null,
        content: personalizedText,
        subject: `Rappel — ${event.name} · ${dateStr}`,
        eventName: event.name,
        params,
        channels: regChannels,
      });

      // Comptabiliser les résultats
      for (const [ch, result] of Object.entries(results)) {
        if (result.ok) {
          channelStats[ch].sent++;
        } else {
          channelStats[ch].failed++;
        }
      }
    }

    // Enregistrer l'horodatage anti-flood pour chaque canal utilisé
    for (const ch of availableChannels) {
      if (channelStats[ch].sent > 0) {
        lastReminderSent.set(`${data.event_id}:${ch}`, Date.now());
      }
    }

    // Calculer les totaux
    const totalSent = Object.values(channelStats).reduce((sum, s) => sum + s.sent, 0);
    const totalFailed = Object.values(channelStats).reduce((sum, s) => sum + s.failed, 0);

    return {
      ok: true as const,
      sent: totalSent,
      failed: totalFailed,
      total: registrations.length,
      details: channelStats,
      blockedChannels: blockedChannels.length > 0 ? blockedChannels : undefined,
    };
  });
