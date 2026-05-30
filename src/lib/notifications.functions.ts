import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  to: z.string().min(6).max(32),
  content: z.string().min(1).max(4096).optional(),
  channel: z.enum(["WhatsApp", "SMS", "Telegram", "Email"]).default("WhatsApp"),
  template: z
    .object({
      name: z.string().min(1).max(128),
      languageCode: z.string().min(2).max(10).default("fr"),
      // Variables ordonnées qui remplaceront {{1}}, {{2}}, ... dans le template
      parameters: z.array(z.string().max(1024)).max(20).optional(),
    })
    .optional(),
});

export type SendHubMessageInput = z.infer<typeof InputSchema>;

/**
 * Envoie un message via le Hub ANSUT (WhatsApp / SMS / Telegram / Email).
 * Endpoint unique : <ANSUT_HUB_URL>/api/message/send
 *
 * Pour WhatsApp avec template, on envoie `whatsAppTemplate` avec :
 *  - name           : nom du template approuvé côté Hub
 *  - languageCode   : code langue (ex. "fr")
 *  - parameters     : valeurs ordonnées injectées dans {{1}}, {{2}}, ...
 *  - components     : structure compatible WhatsApp Cloud API (body / parameters)
 * On envoie les deux formats pour maximiser la compatibilité côté Hub.
 */
export const sendHubMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const baseUrl = process.env.ANSUT_HUB_URL;
    const username = process.env.ANSUT_HUB_USERNAME;
    const password = process.env.ANSUT_HUB_PASSWORD;

    if (!baseUrl || !username || !password) {
      console.error("ANSUT Hub credentials missing");
      return { ok: false, error: "Hub non configuré" as const };
    }

    const url = `${baseUrl.replace(/\/+$/, "")}/api/message/send`;

    const payload: Record<string, unknown> = {
      username,
      password,
      channel: data.channel,
      to: data.to,
    };

    if (data.template) {
      const params = data.template.parameters ?? [];
      payload.whatsAppTemplate = {
        name: data.template.name,
        languageCode: data.template.languageCode,
        parameters: params,
        components: params.length
          ? [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ]
          : [],
      };
      // Fallback texte si le Hub ignore le template
      if (!data.content && params.length) {
        payload.content = params.join(" — ");
      }
    }
    if (data.content) payload.content = data.content;

    // Texte de repli garanti (même si l'appelant n'a rien passé)
    const fallbackText =
      (typeof payload.content === "string" && payload.content) ||
      (data.template
        ? buildFallbackFromTemplate(data.template.name, data.template.parameters ?? [])
        : "");
    if (data.channel !== "Email" && fallbackText) {
      payload.content = fallbackText;
    }

    const send = async (body: Record<string, unknown>) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      return { status: res.status, ok: res.ok, text };
    };

    // Détecte une réponse du Hub indiquant que le template n'a pas pu être appliqué
    const looksLikeTemplateError = (status: number, body: string) => {
      if (status === 404 || status === 422) return true;
      const b = body.toLowerCase();
      return (
        b.includes("template") &&
        (b.includes("not found") ||
          b.includes("introuvable") ||
          b.includes("unknown") ||
          b.includes("invalid") ||
          b.includes("not approved") ||
          b.includes("non approuv"))
      );
    };

    try {
      // 1ère tentative : avec template + content de repli
      let attempt = await send(payload);
      if (attempt.ok) return { ok: true, body: attempt.text };

      // 2nde tentative : texte simple si le template a été rejeté et qu'on a un fallback
      if (
        data.template &&
        fallbackText &&
        looksLikeTemplateError(attempt.status, attempt.text)
      ) {
        console.warn(
          "Hub template rejeté, repli sur texte simple",
          data.template.name,
          attempt.status,
        );
        const { whatsAppTemplate: _omit, ...rest } = payload;
        const retry = await send({ ...rest, content: fallbackText });
        if (retry.ok) {
          return { ok: true, body: retry.text, fallback: true as const };
        }
        console.error("Hub fallback aussi en échec", retry.status, retry.text);
        return { ok: false, error: `Hub ${retry.status}`, body: retry.text };
      }

      console.error("Hub send failed", attempt.status, attempt.text);
      return { ok: false, error: `Hub ${attempt.status}`, body: attempt.text };
    } catch (err) {
      console.error("Hub send exception", err);
      return { ok: false, error: "Erreur réseau Hub" as const };
    }
  });

/** Texte minimal généré à partir des paramètres du template si rien d'autre n'est fourni. */
function buildFallbackFromTemplate(name: string, params: string[]): string {
  if (name === "ansut_event_confirmation" && params.length >= 3) {
    const [fullName, eventName, date, location] = params;
    return `Bonjour ${fullName}, votre inscription à "${eventName}" est confirmée.\nDate : ${date}${
      location ? `\nLieu : ${location}` : ""
    }\n\nMerci — ANSUT EVENT.`;
  }
  return params.filter(Boolean).join(" — ");
}

/**
 * Construit les variables ordonnées pour le template de confirmation d'inscription.
 * Doit correspondre à un template approuvé côté Hub (ex. `ansut_event_confirmation`)
 * avec un corps du type :
 *   "Bonjour {{1}}, votre inscription à {{2}} le {{3}} ({{4}}) est confirmée."
 */
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
