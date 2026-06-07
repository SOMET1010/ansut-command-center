import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Envoi de rappels aux participants inscrits à un événement.
 *
 * Sécurité :
 *  - L'appelant fournit uniquement l'event_id.
 *  - Le serveur récupère les données depuis la base via le service role.
 *  - Utilise le Hub ANSUT existant pour l'envoi (même infrastructure que les confirmations).
 *  - Anti-flood : un seul rappel par événement toutes les 4 heures.
 */

const ReminderSchema = z.object({
  event_id: z.string().uuid(),
});

// Anti-flood : stocke le dernier envoi par event_id
const lastReminderSent = new Map<string, number>();
const MIN_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 heures

export const sendEventReminder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReminderSchema.parse(input))
  .handler(async ({ data }) => {
    // Anti-flood
    const lastSent = lastReminderSent.get(data.event_id) ?? 0;
    if (Date.now() - lastSent < MIN_INTERVAL_MS) {
      const remainingMin = Math.ceil((MIN_INTERVAL_MS - (Date.now() - lastSent)) / 60_000);
      return {
        ok: false as const,
        error: `Un rappel a déjà été envoyé récemment. Réessayez dans ${remainingMin} minutes.`,
        sent: 0,
      };
    }

    // Récupérer l'événement
    const { data: event, error: evErr } = await supabaseAdmin
      .from("events")
      .select("id, name, starts_at, ends_at, location")
      .eq("id", data.event_id)
      .single();

    if (evErr || !event) {
      return { ok: false as const, error: "Événement introuvable", sent: 0 };
    }

    // Récupérer les inscrits confirmés (pas annulés)
    const { data: registrations, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .select("id, full_name, email, phone, status")
      .eq("event_id", data.event_id)
      .in("status", ["confirmed", "pending"]);

    if (regErr) {
      return { ok: false as const, error: regErr.message, sent: 0 };
    }

    if (!registrations || registrations.length === 0) {
      return { ok: false as const, error: "Aucun inscrit à notifier", sent: 0 };
    }

    // Préparer le contenu du rappel
    const dateStr = new Date(event.starts_at).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const location = (event.location ?? "en ligne").trim() || "en ligne";

    // Configuration Hub ANSUT
    const baseUrl = process.env.ANSUT_HUB_URL;
    const username = process.env.ANSUT_HUB_USERNAME;
    const password = process.env.ANSUT_HUB_PASSWORD;

    if (!baseUrl || !username || !password) {
      console.error("ANSUT Hub credentials missing for reminders");
      return { ok: false as const, error: "Hub de notification non configuré", sent: 0 };
    }

    const url = `${baseUrl.replace(/\/+$/, "")}/api/message/send`;
    let sentCount = 0;
    let failCount = 0;

    // Envoyer les rappels par email (batch)
    for (const reg of registrations) {
      if (!reg.email) continue;

      const emailContent = [
        `Bonjour ${reg.full_name},`,
        ``,
        `Ceci est un rappel pour l'événement "${event.name}" auquel vous êtes inscrit(e).`,
        ``,
        `📅 Date : ${dateStr}`,
        `📍 Lieu : ${location}`,
        ``,
        `N'oubliez pas de vous munir de votre badge QR (reçu lors de votre inscription) pour le contrôle d'accès.`,
        ``,
        `À bientôt !`,
        `L'équipe ANSUT EVENT`,
      ].join("\n");

      const payload = {
        username,
        password,
        channel: "Email",
        to: reg.email.trim(),
        subject: `Rappel — ${event.name} · ${dateStr}`,
        content: emailContent,
        ishtml: false,
      };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          sentCount++;
        } else {
          failCount++;
          console.error(`Reminder send failed for ${reg.email}:`, res.status);
        }
      } catch (err) {
        failCount++;
        console.error(`Reminder send exception for ${reg.email}:`, err);
      }
    }

    // Enregistrer l'horodatage anti-flood
    lastReminderSent.set(data.event_id, Date.now());

    return {
      ok: true as const,
      sent: sentCount,
      failed: failCount,
      total: registrations.length,
    };
  });
