/**
 * ANSUT Hub — passerelle unique pour SMS / Email / WhatsApp / Telegram.
 *
 * **Tout** envoi sortant DOIT passer par `sendViaHub()`. C'est le seul endroit
 * qui :
 *   1. Lit les secrets `ANSUT_HUB_*` (jamais ailleurs).
 *   2. Normalise l'URL du Hub (accepte `https://hub.ansut.ci` ou un vieux
 *      `…/api/SendSMS`).
 *   3. Applique le fallback WhatsApp #131058 → texte libre.
 *   4. Journalise dans `audit_trail` (succès ET échec) — best-effort, n'échoue
 *      jamais le send si l'audit échoue.
 *
 * Server-only — importe `supabaseAdmin` (service role). Ne JAMAIS l'importer
 * depuis du code client.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type NotifyChannel = "sms" | "email" | "whatsapp" | "telegram";

export interface SendViaHubInput {
  channel: NotifyChannel;
  /** Phone E.164 (SMS/WhatsApp), email (Email), chat_id (Telegram). */
  to: string;
  /** Texte du message (obligatoire sauf WhatsApp pur-template). */
  text?: string;
  /** Email uniquement. */
  subject?: string;
  /** Email uniquement (HTML opt-in). */
  ishtml?: boolean;
  /** Email uniquement. */
  cc?: string;
  /** Sender alphanumérique pour SMS (défaut "ANSUT"). */
  from?: string;
  /** WhatsApp uniquement — premier contact hors fenêtre 24h. */
  whatsAppTemplate?: {
    name: string;
    languageCode: string;
    parameters?: string[];
  };
  /** Métadonnées pour l'audit (event_id, registration_id, purpose, etc.). */
  audit?: {
    purpose: string;
    eventId?: string | null;
    registrationId?: string | null;
    organizationId?: string | null;
    userId?: string | null;
  };
}

export type SendViaHubResult =
  | {
      ok: true;
      channel: NotifyChannel;
      fallback?: { from: "template"; to: "text"; reason: "META_131058" };
    }
  | {
      ok: false;
      error: { code: string; status?: number; message: string; details?: unknown };
    };

const HUB_TIMEOUT_MS = 15_000;

/**
 * Normalise l'URL du Hub : supprime un éventuel suffixe `/api/SendSMS` ou
 * `/api/message/send` pour qu'on puisse reconstruire l'endpoint voulu.
 */
function normalizeHubBase(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api\/(SendSMS|message\/send)$/i, "");
}

/** Masque un destinataire pour les logs (RGPD-friendly). */
function maskRecipient(to: string, channel: NotifyChannel): string {
  if (channel === "email") {
    const [user, domain] = to.split("@");
    if (!domain) return "***";
    return `${user.slice(0, 2)}***@${domain}`;
  }
  // Phone / chat_id : garder les 4 derniers chiffres
  const digits = to.replace(/\D/g, "");
  if (digits.length <= 4) return "***";
  return `***${digits.slice(-4)}`;
}

async function logAudit(input: SendViaHubInput, result: SendViaHubResult) {
  try {
    await supabaseAdmin.from("audit_trail").insert({
      table_name: "notifications",
      action: result.ok ? "NOTIFY_SENT" : "NOTIFY_FAILED",
      organization_id: input.audit?.organizationId ?? null,
      user_id: input.audit?.userId ?? null,
      payload: {
        channel: input.channel,
        recipient_masked: maskRecipient(input.to, input.channel),
        purpose: input.audit?.purpose ?? "unspecified",
        event_id: input.audit?.eventId ?? null,
        registration_id: input.audit?.registrationId ?? null,
        whatsapp_template: input.whatsAppTemplate?.name ?? null,
        result: result.ok
          ? { ok: true, fallback: result.ok && result.fallback ? result.fallback : null }
          : { ok: false, error: result.error },
      },
    });
  } catch (err) {
    // Audit ne doit JAMAIS casser un envoi.
    console.warn("[ansut-notify] audit_trail insert failed", err);
  }
}

interface HubCallInput {
  baseUrl: string;
  username: string;
  password: string;
  channel: NotifyChannel;
  to: string;
  text?: string;
  subject?: string;
  ishtml?: boolean;
  cc?: string;
  from?: string;
  whatsAppTemplate?: SendViaHubInput["whatsAppTemplate"];
  mode: "template" | "text";
}

async function callHub(input: HubCallInput): Promise<Response> {
  const isSms = input.channel === "sms";
  const url = isSms
    ? `${input.baseUrl}/api/SendSMS`
    : `${input.baseUrl}/api/message/send`;

  const phoneStripped = (input.to ?? "").trim().replace(/^\+/, "");

  let body: Record<string, unknown>;
  if (isSms) {
    body = {
      username: input.username,
      password: input.password,
      to: input.to.trim(),
      from: input.from ?? "ANSUT",
      content: input.text ?? "",
    };
  } else if (input.channel === "email") {
    body = {
      username: input.username,
      password: input.password,
      channel: "Email",
      to: input.to.trim(),
      cc: input.cc,
      subject: input.subject ?? "Notification ANSUT",
      content: input.text ?? "",
      ishtml: input.ishtml ?? true,
    };
  } else if (input.channel === "telegram") {
    body = {
      username: input.username,
      password: input.password,
      channel: "Telegram",
      to: input.to.trim(),
      content: input.text ?? "",
    };
  } else {
    // WhatsApp
    body = {
      username: input.username,
      password: input.password,
      channel: "WhatsApp",
      to: phoneStripped,
    };
    if (input.mode === "template" && input.whatsAppTemplate) {
      const params = input.whatsAppTemplate.parameters ?? [];
      body.whatsAppTemplate = {
        name: input.whatsAppTemplate.name,
        languageCode: input.whatsAppTemplate.languageCode,
        parameters: params,
        components: params.length
          ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }]
          : undefined,
      };
    } else {
      body.content = input.text ?? "";
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HUB_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Détecte l'erreur Meta #131058 (template non autorisé / sandbox) dans une
 * réponse Hub, qu'elle soit imbriquée ou en clair.
 */
function isMeta131058(body: unknown): boolean {
  const json = JSON.stringify(body ?? "");
  return /131058/.test(json) || /template.*not.*allowed/i.test(json);
}

export async function sendViaHub(input: SendViaHubInput): Promise<SendViaHubResult> {
  const rawBase = process.env.ANSUT_HUB_URL;
  const username = process.env.ANSUT_HUB_USERNAME;
  const password = process.env.ANSUT_HUB_PASSWORD;

  if (!rawBase || !username || !password) {
    const result: SendViaHubResult = {
      ok: false,
      error: { code: "HUB_NOT_CONFIGURED", message: "ANSUT_HUB_* secrets missing" },
    };
    await logAudit(input, result);
    return result;
  }

  // Validation minimale
  if (!input.to?.trim()) {
    const result: SendViaHubResult = {
      ok: false,
      error: { code: "BAD_REQUEST", message: "Destinataire manquant" },
    };
    await logAudit(input, result);
    return result;
  }
  const mode: "template" | "text" =
    input.channel === "whatsapp" && input.whatsAppTemplate ? "template" : "text";
  if (mode === "text" && !input.text?.trim()) {
    const result: SendViaHubResult = {
      ok: false,
      error: { code: "BAD_REQUEST", message: "Texte du message manquant" },
    };
    await logAudit(input, result);
    return result;
  }

  const baseUrl = normalizeHubBase(rawBase);
  console.log(`[ansut-notify] Sending ${input.channel} → ${maskRecipient(input.to, input.channel)}`);

  let response: Response;
  try {
    response = await callHub({
      baseUrl,
      username,
      password,
      channel: input.channel,
      to: input.to,
      text: input.text,
      subject: input.subject,
      ishtml: input.ishtml,
      cc: input.cc,
      from: input.from,
      whatsAppTemplate: input.whatsAppTemplate,
      mode,
    });
  } catch (err) {
    const result: SendViaHubResult = {
      ok: false,
      error: {
        code: "GATEWAY_ERROR",
        message: err instanceof Error ? err.message : "Hub network error",
      },
    };
    console.error("[ansut-notify] gateway error", err);
    await logAudit(input, result);
    return result;
  }

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* keep as text */
  }

  // Fallback WhatsApp #131058 — retente une fois en mode texte libre.
  if (
    !response.ok &&
    input.channel === "whatsapp" &&
    mode === "template" &&
    input.text?.trim() &&
    isMeta131058(parsed)
  ) {
    console.warn("[ansut-notify] WhatsApp template refused (#131058) — fallback to text");
    try {
      const fallbackRes = await callHub({
        baseUrl,
        username,
        password,
        channel: "whatsapp",
        to: input.to,
        text: input.text,
        mode: "text",
      });
      if (fallbackRes.ok) {
        const result: SendViaHubResult = {
          ok: true,
          channel: "whatsapp",
          fallback: { from: "template", to: "text", reason: "META_131058" },
        };
        await logAudit(input, result);
        return result;
      }
    } catch (err) {
      console.error("[ansut-notify] fallback failed", err);
    }
    const result: SendViaHubResult = {
      ok: false,
      error: {
        code: "TEMPLATE_NOT_ALLOWED",
        status: response.status,
        message: "WhatsApp template refusé par Meta (#131058) et fallback texte indisponible",
        details: parsed,
      },
    };
    await logAudit(input, result);
    return result;
  }

  if (!response.ok) {
    const result: SendViaHubResult = {
      ok: false,
      error: {
        code: "GATEWAY_ERROR",
        status: response.status,
        message: `Hub ${response.status}`,
        details: parsed,
      },
    };
    console.error("[ansut-notify] Hub error", response.status, parsed);
    await logAudit(input, result);
    return result;
  }

  const result: SendViaHubResult = { ok: true, channel: input.channel };
  await logAudit(input, result);
  return result;
}
